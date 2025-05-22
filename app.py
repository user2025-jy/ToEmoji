from flask import Flask, render_template, request, jsonify
import os
import requests
from werkzeug.utils import secure_filename
import base64
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小为16MB
app.config['UPLOAD_FOLDER'] = 'uploads'

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# API配置
API_URL = os.getenv('API_URL', 'https://api.nuwaapi.com/v1/images/edits')
API_KEY = os.getenv('API_KEY', 'sk-Q2GAryKjWZ3z4px5hJJ7C4oc51Dcnq18z3D9J1bFtxhOwh4v')
API_PROMPT = os.getenv('API_PROMPT', '参考图中主体物和材质，将图中主体物变成emoji风格，拟物风，轻写实，透明背景')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_image():
    if 'image' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件类型'}), 400

    try:
        # 准备API请求
        files = {
            'image': (file.filename, file.stream, file.content_type)
        }
        
        data = {
            'model': 'gpt-image-1',
            'n': 1,
            'prompt': API_PROMPT
        }
        
        headers = {
            'Authorization': f'Bearer {API_KEY}'
        }

        # 发送请求到API
        response = requests.post(API_URL, files=files, data=data, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        # 返回生成的图片数据
        return jsonify({
            'success': True,
            'image_data': result['data'][0]['b64_json']
        })

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'API请求失败: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'处理失败: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 