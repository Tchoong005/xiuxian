import os
import uuid
import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client

# --- 环境配置 ---
# 强制读取根目录下的 .env 文件
load_dotenv(".env")

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "xiuxian_2.0_secret_k3y")

# Supabase 客户端初始化
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# --- 核心逻辑：身份判定 ---

def get_current_owner():
    """
    确定当前会话的存档归属信息。
    返回: (owner_type, owner_id)
    """
    if "user_id" in session:
        # 已登录正式账号
        return "user", str(session["user_id"])
    
    # 游客模式：确保 session 中有 guest_id
    if "guest_id" not in session:
        # 延迟分配，不在这里强行修改 session 以防 GET 请求干扰
        return None, None
        
    return "guest", str(session["guest_id"])

# --- 页面路由 ---

@app.route('/')
@app.route('/start')
def start_page():
    return render_template('start.html')

@app.route('/game')
def game_page():
    o_type, o_id = get_current_owner()
    if not o_id:
        return redirect(url_for('start_page'))
    return render_template('game.html')

# --- API: 身份与账户 ---

@app.route("/api/guest", methods=['POST'])
def api_guest_init():
    """生成或初始化游客 ID"""
    if "user_id" in session:
        return jsonify(ok=False, error="当前已登录正式账号")
    
    if "guest_id" not in session:
        session["guest_id"] = str(uuid.uuid4())
    
    return jsonify(ok=True, guest_id=session["guest_id"])

@app.route("/api/register", methods=['POST'])
def api_register():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(ok=False, error="道号与道印不可为空")

    try:
        # 查重 (统一字段 password_hash)
        exist = sb.table("users").select("id").eq("username", username).execute()
        if exist.data:
            return jsonify(ok=False, error="此道号已被占领")

        pwd_hash = generate_password_hash(password)
        ins = sb.table("users").insert({
            "username": username,
            "password_hash": pwd_hash
        }).execute()

        if not ins.data:
            return jsonify(ok=False, error="天机阻塞，开辟仙路失败")

        user_id = ins.data[0]["id"]
        
        # 注册后自动清理旧 session 并登录新账号
        session.clear()
        session["user_id"] = user_id
        session["username"] = username
        
        return jsonify(ok=True, user_id=user_id)
    except Exception as e:
        return jsonify(ok=False, error=str(e))

@app.route("/api/login", methods=['POST'])
def api_login():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    try:
        # 统一字段 password_hash
        q = sb.table("users").select("id, username, password_hash").eq("username", username).limit(1).execute()
        if not q.data:
            return jsonify(ok=False, error="道号未曾开辟")

        row = q.data[0]
        if not check_password_hash(row["password_hash"], password):
            return jsonify(ok=False, error="道印不合，无法入境")

        session.clear()
        session["user_id"] = row["id"]
        session["username"] = row["username"]

        return jsonify(ok=True, user_id=row["id"])
    except Exception as e:
        return jsonify(ok=False, error=str(e))

@app.route("/api/logout", methods=['POST'])
def api_logout():
    session.clear()
    return jsonify(ok=True)

@app.route("/api/me", methods=['GET'])
def api_me():
    o_type, o_id = get_current_owner()
    return jsonify(
        ok=True if o_id else False,
        owner_type=o_type,
        owner_id=o_id,
        username=session.get("username")
    )

# --- API: 存档核心 (Phase 1 关键修复) ---

@app.route('/api/save', methods=['POST'])
def api_save():
    o_type, o_id = get_current_owner()
    if not o_id:
        return jsonify(ok=False, error="身份模糊，难以存入命理"), 401
    
    js = request.get_json(force=True)
    save_data = js.get("save")
    slot = js.get("slot", 1)
    
    try:
        # 使用 UPSERT 并显式指定 on_conflict 字段，彻底解决 duplicate key 错误
        # 合并 owner_type, owner_id, slot 形成唯一约束覆盖
        res = sb.table("saves").upsert({
            "owner_type": o_type,
            "owner_id": o_id,
            "slot": slot,
            "data": save_data,
            "updated_at": datetime.datetime.now().isoformat()
        }, on_conflict="owner_type,owner_id,slot").execute()
        
        if res.data:
            return jsonify(ok=True)
        return jsonify(ok=False, error="因果存入失败")
    except Exception as e:
        print(f"Save Error: {e}")
        return jsonify(ok=False, error=str(e)), 500

@app.route('/api/load', methods=['GET'])
def api_load():
    o_type, o_id = get_current_owner()
    if not o_id:
        return jsonify(ok=False, error="尚未确认身份"), 401
    
    slot = request.args.get("slot", 1)
    
    try:
        # 严格按照 owner_type, owner_id, slot 三字段定位加载
        res = sb.table("saves").select("data")\
            .eq("owner_type", o_type)\
            .eq("owner_id", o_id)\
            .eq("slot", slot)\
            .maybe_single().execute()
            
        if res.data:
            return jsonify(ok=True, save=res.data['data'])
        return jsonify(ok=False, error="尚未寻得过往命数"), 404
    except Exception as e:
        print(f"Load Error: {e}")
        return jsonify(ok=False, error=str(e)), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 8000))
    app.run(debug=True, port=port)
