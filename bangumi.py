from flask import *
from furl import furl
import requests

app = Flask(__name__)

# github生成的两把钥匙
client_id = 'bgm1766602b6ecd75ca7'
client_secret = 'f74c225b5755a10c23b329cc97fd5887'


@app.route('/', methods=['GET', 'POST'])
def index():
    url = 'https://bgm.tv/oauth/authorize'
    params = {'client_id': client_id, 'response_type': 'code'}
    url = furl(url).set(params)

    return redirect(url, 302)


@app.route('/callback/code')
def callback_code():
    code = request.args.get('code')
    url = "https://bgm.tv/oauth/access_token"
    data = {"grant_type": "authorization_code", "client_id": client_id,
            "client_secret": client_secret, "code": code, "redirect_uri": "http://127.0.0.1:5000/callback/code"}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'}

    res = requests.post(url=url, data=data, headers=headers)
    print(res.request.headers)
    print(res.headers)
    return res.content


@app.route('/test')
def callback_token():
    params = {'responseGroup': 'large'}
    # headers = {
    #     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
    #     "Authorization": "Bearer a6095a5371af4d5b2fb869eb5f45fd7045ac217d"}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'}
    res = requests.get('http://api.bgm.tv/subject/262897',
                       params=params, headers=headers)
    print(res.json())
    print(res.headers)
    print(res.url)
    return str(res.json())


if __name__ == '__main__':
    app.run(debug = True)
