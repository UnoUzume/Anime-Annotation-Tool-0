from flask import Flask, render_template, Response, make_response, request
from furl import furl
from datetime import timedelta
import matplotlib.pyplot as plt
import io
import re
import time
from concurrent.futures import ThreadPoolExecutor
import zlib
import base64
from pathlib import Path
import numpy as np
from PIL import Image
import requests
import opencv1
import opencv2
from cv2 import cv2

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds=5)

video_path = Path("static/yuri2.3.mp4")
video1 = opencv1.Video(str(video_path))
video2 = opencv2.Video(str(video_path))
video1.keyframes = video2.keyframes
ann_path = Path("annotation").joinpath(video_path.stem)
ann_path.mkdir(parents=True, exist_ok=True)

label_list = [{"id": "250", "name": "bg", "bgc": "4e4e4e"},
              {"id": "1", "name": "赤座灯里", "bgc": "ff584f"},
              {"id": "2", "name": "岁纳京子", "bgc": "ff802c"},
              {"id": "3", "name": "船见结衣", "bgc": "85537a"},
              {"id": "4", "name": "吉川千夏", "bgc": "ffa8c5"},
              {"id": "5", "name": "杉浦绫乃", "bgc": "9c4462"},
              {"id": "6", "name": "池田千岁", "bgc": "fae9f4"},
              {"id": "7", "name": "大室樱子", "bgc": "ffe5ae"},
              {"id": "8", "name": "古谷向日葵", "bgc": "7296b9"}]
lut_b = np.zeros(256, dtype=np.dtype('uint8'))
lut_g = np.zeros(256, dtype=np.dtype('uint8'))
lut_r = np.zeros(256, dtype=np.dtype('uint8'))
for i in range(len(label_list)):
    label = label_list[i]
    label_id = int(label["id"])
    lut_b[label_id] = int(label["bgc"][4:6], 16)
    lut_g[label_id] = int(label["bgc"][2:4], 16)
    lut_r[label_id] = int(label["bgc"][0:2], 16)
    label["bgc_style"] = 'style=background-color:#' + label["bgc"]
lut = np.dstack((lut_b, lut_g, lut_r))

frame_num_gj = 0  # frame_num_get_just
mask_water_dic = {}  # compressed

executor = ThreadPoolExecutor()


def save_file(filename, bytes):
    fo = open(ann_path.joinpath(filename), "wb")
    fo.write(bytes)
    fo.close()


def save_mask(frame, mask_canvas_comped, mask_water):
    time_start = time.time()
    _, png_data = cv2.imencode('.png', frame)
    save_file(str(frame_num_gj)+"_frame.png", png_data)

    save_file(str(frame_num_gj)+"_mask_canvas.bytes", mask_canvas_comped)

    mask_water_comped = zlib.compress(mask_water.tobytes())
    mask_water_dic[frame_num_gj] = mask_water_comped
    save_file(str(frame_num_gj)+"_mask_water.bytes", mask_water_comped)

    mask_water = cv2.cvtColor(mask_water, cv2.COLOR_GRAY2RGB)
    _, png_data = cv2.imencode('.png', mask_water)
    save_file(str(frame_num_gj)+"_mask_water.png", png_data)

    color_water = cv2.LUT(mask_water, lut)
    _, png_data = cv2.imencode('.png', color_water)
    save_file(str(frame_num_gj)+"_color_water.png", png_data)
    time_end = time.time()
    print("save mask: "+str(time_end-time_start))


@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('anime.html', video2=video2, label_list=label_list, video_path=str(video_path))


@app.route('/frame/<frame_num>', methods=['GET', 'POST'])
def get_frame(frame_num):
    frame_num = int(frame_num)
    for _ in range(20):
        time.sleep(0.2)
        image_data = video1.get_bytes(frame_num)
        if image_data is not None:
            executor.submit(video1.pre_get, frame_num)
            response = make_response(image_data)
            response.headers['Content-Type'] = 'image/png'
            return response


@app.route('/send/<task>', methods=['POST'])
def send(task):
    # if request.method == 'POST':
    global frame_num_gj
    if task == "get_frame":
        frame_num_gj = int(request.form['num_to_get'])
        return "get_frame ok"
    elif task == "gen_water":
        if 'mask_canvas_b64' in request.form:
            time_start = time.time()

            mask_canvas_comped = base64.b64decode(
                request.form['mask_canvas_b64'])
            mask_byte = zlib.decompress(mask_canvas_comped)
            mask_img = np.frombuffer(
                mask_byte[0::4], dtype=np.uint8).copy().reshape(540, 960)

            frame = video1.get(frame_num_gj)
            frame = cv2.resize(frame, (960, 540))
            mask_img = mask_img.astype("int32")

            time_end = time.time()
            print("gen mask: "+str(time_end-time_start))
            time_start = time_end

            mask_water = cv2.watershed(frame, markers=mask_img)
            mask_water = mask_water.astype("uint8")  # -1 -> 255
            executor.submit(save_mask, frame,
                            mask_canvas_comped, mask_water)

            mask_water_comped = zlib.compress(mask_water.tobytes())
            base64_str = base64.b64encode(mask_water_comped).decode('ascii')

            time_end = time.time()
            print("gen mask: "+str(time_end-time_start))
            return base64_str
        return "gen_water error"


@app.route('/get', methods=['POST'])
def get():
    result = {}
    for key in request.json['keys']:
        if key == 'keyframes':
            if video2.keyframes is not None:
                result['keyframes'] = video2.keyframes.tolist()
        elif key == 'diff_value':
            if video2.diff_value is not None:
                result['diff_value'] = video2.diff_value.tolist()
        elif key == 'diff_value_cut':
            if video2.diff_value is not None:
                temp = video2.diff_value.copy()
                temp[temp > 3e7] = 3e7
                result['diff_value'] = temp.tolist()
        elif key == 'label_lut':
            result['label_lut'] = lut.tolist()
    return result


def event_stream():
    while video2.ana_keyframes_lock <= 2:
        time.sleep(0.2)
        if video2.ana_keyframes_lock == 1:
            video2.ana_keyframes_lock = 0
            yield 'data: %s/%s %s\n\n' % (video2.keyframes[-1], video2.frames_tatal, video2.keyframes[-1]-video2.keyframes[-2])
        elif video2.ana_keyframes_lock == 2:
            video2.ana_keyframes_lock = 3
            video1.keyframes = video2.keyframes
            print("yield end")
            yield 'event: yield_end\ndata: tatal keyframes: %s\n\n' % len(video2.keyframes)


@app.route('/ana_keyframes', methods=['GET', 'POST'])
def ana_keyframes():
    executor.submit(video2.ana_keyframes_process)
    return Response(event_stream(), mimetype="text/event-stream")


if __name__ == '__main__':
    app.run(debug=True)
    # app.run(debug=True, threaded=True)
