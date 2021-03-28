var is_creat_start = false;
var diff_value = null;
var keyframes = null;
var mask_canvas_dic = {};
var color_canvas_dic = {};
var color_water_dic = {};

var mask_canvas_undo_data = [];
var mask_canvas_redo_data = [];
var mask_canvas_ctx = null;
var color_canvas_undo_data = [];
var color_canvas_redo_data = [];
var color_canvas_ctx = null;
var color_water_ctx = null;
var label_key_map = {
    f: 1,
    q: 2,
    w: 3,
    e: 4,
    r: 5,
    z: 6,
    x: 7,
    c: 8,
    v: 9,
};
var label_lut = null;

function cursorMove(e) {
    var canvas = document.querySelector(".workspace__canvas-wrapper");
    var left = canvas.getBoundingClientRect().left;
    var top = canvas.getBoundingClientRect().top;
    $(".workspace__cursor")[0].style.left = e.clientX - left + "px";
    $(".workspace__cursor")[0].style.top = e.clientY - top + "px";
}
function canvas_redo_push() {
    color_canvas_undo_data.push(color_canvas_ctx.getImageData(0, 0, 960, 540));
    mask_canvas_undo_data.push(mask_canvas_ctx.getImageData(0, 0, 960, 540));
    if (color_canvas_undo_data.length > 100) {
        color_canvas_undo_data = color_canvas_undo_data.slice(50, -1);
        mask_canvas_undo_data = mask_canvas_undo_data.slice(50, -1);
    }
    $(".ann-tool__undo-length").text(color_canvas_undo_data.length);
}
function drawStart(e) {
    if (e.button != 0) {
        return;
    }
    drawMoving(e);
    document.addEventListener("mousemove", drawMoving);
    document.addEventListener("mouseup", drawEnd);
}
function drawMoving(event) {
    var color_canvas = document.querySelector(".workspace__color-canvas");
    var left = color_canvas.getBoundingClientRect().left;
    var top = color_canvas.getBoundingClientRect().top;
    var width = color_canvas.getBoundingClientRect().width;
    var height = color_canvas.getBoundingClientRect().height;
    let length = parseInt($(".ann-tool__brush-size").val());
    let x = parseInt(((event.clientX - left) / width) * 960 - length);
    let y = parseInt(((event.clientY - top) / height) * 540 - length);
    // canvas_ctx.beginPath();
    // canvas_ctx.arc((e.offsetX / width) * 960, (e.offsetY / height) * 540, $(".ann-tool__brush-size").val(), 0, 2 * Math.PI);
    // canvas_ctx.arc(
    //     ((e.clientX - left) / width) * 960,
    //     ((e.clientY - top) / height) * 540,
    //     $(".ann-tool__brush-size").val(),
    //     0,
    //     2 * Math.PI
    // );
    if (!event.shiftKey) {
        color_canvas_ctx.fillStyle = $(".ann-label__item.active .ann-label__color").css("background-color");
        // canvas_ctx.fill();
        color_canvas_ctx.fillRect(x, y, length * 2, length * 2);

        let fill_hex = parseInt($(".ann-label__item.active .ann-label__id").val()).toString(16);
        if (fill_hex.length == 1) {
            fill_hex = "0" + fill_hex;
        }
        mask_canvas_ctx.fillStyle = "#" + fill_hex + fill_hex + fill_hex;
        mask_canvas_ctx.fillRect(x, y, length * 2, length * 2);

        $(".workspace__color-canvas").data("isEmpty", "false");
    } else {
        color_canvas_ctx.clearRect(x - length, y - length, length * 4, length * 4);
        mask_canvas_ctx.clearRect(x - length, y - length, length * 4, length * 4);
    }
}
function drawEnd(e) {
    if (e.button != 0) {
        return;
    }
    canvas_redo_push();
    document.removeEventListener("mousemove", drawMoving);
    document.removeEventListener("mouseup", drawEnd);
}
function creatBox(e) {
    if (e.button != 0) {
        return;
    }
    if (is_creat_start) {
        is_creat_start = false;
    } else {
        is_creat_start = true;
        var main_canvas = document.querySelector(".workspace__canvas-box");
        var left = main_canvas.getBoundingClientRect().left;
        var top = main_canvas.getBoundingClientRect().top;
        var mydiv = document.getElementById("box");
        if (!mydiv) {
            mydiv = document.createElement("div");
            mydiv.setAttribute("id", "box");
            main_canvas.appendChild(mydiv);
            mydiv.style.position = "absolute";
            mydiv.style.lineHeight = "20px";
            mydiv.style.borderStyle = "solid";
            mydiv.style.borderColor = "blue";
            mydiv.style.borderWidth = "2px";
            mydiv.style.display = "block";
        }
        mydiv.style.width = "0px";
        mydiv.style.height = "0px";
        mydiv.dataset.x_value = e.clientX - left;
        mydiv.dataset.y_value = e.clientY - top;
        mydiv.style.left = e.clientX - left + "px";
        mydiv.style.top = e.clientY - top + "px";
    }
}
document.addEventListener("mousemove", function (evevt) {
    var main_canvas = document.querySelector(".workspace__canvas-box");
    if (is_creat_start && main_canvas.dataset.isMoving == "false") {
        var left = main_canvas.getBoundingClientRect().left;
        var top = main_canvas.getBoundingClientRect().top;
        var mydiv = document.getElementById("box");
        var div_w, div_h;
        div_w = evevt.clientX - left > mydiv.dataset.x_value ? evevt.clientX - left - mydiv.dataset.x_value : 0;
        div_h = evevt.clientY - top > mydiv.dataset.y_value ? evevt.clientY - top - mydiv.dataset.y_value : 0;
        mydiv.style.width = div_w + "px";
        mydiv.style.height = div_h + "px";
    }
});
function canvasMoveStart(e) {
    if (e.button != 1) {
        return;
    }
    if (event.preventDefault) {
        event.preventDefault();
    }
    document.addEventListener("mousemove", canvasMoving);
    document.addEventListener("mouseup", canvasMoveEnd);
    var main_canvas = document.querySelector(".workspace__canvas-box");
    main_canvas.dataset.xc = e.pageX - main_canvas.offsetLeft;
    main_canvas.dataset.yc = e.pageY - main_canvas.offsetTop;
    main_canvas.dataset.isMoving = true;
}
function canvasMoving(e) {
    var main_canvas = document.querySelector(".workspace__canvas-box");
    if (main_canvas.dataset.isMoving == "true") {
        main_canvas.style.left = e.pageX - main_canvas.dataset.xc + "px";
        main_canvas.style.top = e.pageY - main_canvas.dataset.yc + "px";
    }
}
function canvasMoveEnd(e) {
    if (e.button != 1) {
        return;
    }
    document.removeEventListener("mousemove", canvasMoving);
    document.removeEventListener("mouseup", canvasMoveEnd);
    var main_canvas = document.querySelector(".workspace__canvas-box");
    main_canvas.dataset.isMoving = false;
}
document.addEventListener("mousemove", function (e) {
    var myhint = document.querySelector(".mouse-info");
    // myhint.style.display = "block";
    // myhint.style.left = e.pageX + 5 + "px";
    // myhint.style.top = e.pageY + 5 + "px";
    myhint.innerHTML =
        "clientX" +
        e.clientX +
        ",clientY " +
        e.clientY +
        "<br>screenX:" +
        e.screenX +
        ",screenY:" +
        e.screenY +
        "<br>pageX:" +
        e.pageX +
        ",pageY:" +
        e.pageY +
        "<br>offsetX:" +
        e.offsetX +
        ",offsetY:" +
        e.offsetY +
        "<br>x:" +
        e.x +
        ",y:" +
        e.y +
        "<br>movementX:" +
        e.movementX +
        ",movementY:" +
        e.movementY;
});
function get_frame(num_to_get) {
    color_canvas_ctx.clearRect(0, 0, 960, 540);
    mask_canvas_ctx.clearRect(0, 0, 960, 540);
    $(".workspace__color-canvas").data("isEmpty", "true");
    if (diff_value) {
        let low = num_to_get - 200;
        let high = num_to_get + 200;
        if (num_to_get < 200) {
            low = 0;
            high = 400;
        } else if (num_to_get > diff_value.length - 200) {
            low = diff_value.length - 400;
            high = diff_value.length;
        }
        $(".workspace__frames-info-highcharts").highcharts({
            title: {
                text: null,
            },
            legend: {
                enabled: false,
            },
            chart: {
                type: "column",
                animation: false,
                backgroundColor: "transparent",
            },
            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false,
                    },
                    pointStart: low,
                    animation: false,
                    borderWidth: 0,
                    cursor: "pointer",
                    point: {
                        events: {
                            click: function () {
                                get_frame(this.x);
                            },
                        },
                    },
                },
            },
            xAxis: {
                plotLines: [
                    {
                        color: "#0bd699",
                        value: num_to_get,
                        width: 3,
                    },
                ],
            },
            yAxis: {
                title: {
                    text: null,
                },
                tickPositions: [0, 1e7, 2e7, 3e7, 6.5e7],
                // visible: false,
            },
            series: [
                {
                    data: diff_value.slice(low, high),
                    zones: [
                        {
                            value: 1e7,
                            color: "#7cb5ec",
                        },
                        {
                            color: "#FF9655",
                        },
                    ],
                },
            ],
            credits: {
                enabled: false,
            },
        });
    }

    $(".workspace__frame-num").val(num_to_get);
    $(".workspace__frame").attr("src", "/frame/" + num_to_get);
    if (color_water_dic[num_to_get]) {
        $(".workspace__color-water").css("visibility", "visible");
        color_water_ctx.putImageData(color_water_dic[num_to_get], 0, 0);
    } else {
        $(".workspace__color-water").css("visibility", "hidden");
    }
    if (mask_canvas_dic[num_to_get]) {
        mask_canvas_ctx.putImageData(mask_canvas_dic[num_to_get], 0, 0);
        if (color_canvas_dic[num_to_get]) {
            color_canvas_ctx.putImageData(color_canvas_dic[num_to_get], 0, 0);
        } else {
            let mask_canvas_data = mask_canvas_dic[num_to_get].data;
            let imgData = color_canvas_ctx.createImageData(960, 540);
            for (let i = 0; i < mask_canvas_data.length; i += 4) {
                if (mask_canvas_data[i] != 0) {
                    imgData.data[i] = label_lut[0][mask_canvas_data[i]][2];
                    imgData.data[i + 1] = label_lut[0][mask_canvas_data[i]][1];
                    imgData.data[i + 2] = label_lut[0][mask_canvas_data[i]][0];
                    imgData.data[i + 3] = 255;
                }
            }
            color_canvas_ctx.putImageData(imgData, 0, 0);
        }
    }
    $.post("/send/get_frame", { num_to_get: num_to_get }, function (data, status) {}); //图片可能被缓存，所以必须send当前帧编号
}
function out_put(str) {
    $(".page-body__output").append(str + "\n");
    $(".page-body__output")[0].scrollTop = $(".page-body__output")[0].scrollHeight;
}
$(document).ready(function () {
    // document.querySelector(".workspace__canvas-box").addEventListener("mousedown", creatBox);
    $(".workspace__canvas-box").on("mousedown", drawStart);
    $(".workspace__canvas-box").on("mousedown", canvasMoveStart);
    $("body").on("mousemove", cursorMove);
    $(".ann-tool__color-canvas-alpha").on("change", function () {
        $(".workspace__color-canvas").css("opacity", $(this).val());
    });
    $(".ann-tool__color-canvas-visible").on("change", function () {
        if ($(this).prop("checked")) {
            $(".workspace__color-canvas").css("visibility", "visible");
        } else {
            $(".workspace__color-canvas").css("visibility", "hidden");
        }
    });
    $(".ann-tool__color-water-alpha").on("change", function () {
        $(".workspace__color-water").css("opacity", $(this).val());
    });
    $(".ann-tool__color-water-visible").on("change", function () {
        if ($(this).prop("checked")) {
            $(".workspace__color-water").css("visibility", "visible");
        } else {
            $(".workspace__color-water").css("visibility", "hidden");
        }
    });
    $(".ann-tool__canvas-clear").click(function () {
        color_canvas_ctx.clearRect(0, 0, 960, 540);
        mask_canvas_ctx.clearRect(0, 0, 960, 540);
        $(".workspace__color-canvas").data("isEmpty", "true");
        canvas_redo_push();
    });
    $(".ann-tool__canvas-resize").click(function () {
        let scale = parseFloat(($(".workspace__canvas-box")[0].style.transform || `scale(1)`).replace(/[^0-9.]/gi, ""));
        $(".workspace__canvas-box")[0].style.transform = `scale(1)`;
        $(".ann-tool__brush-size").val(parseFloat($(".ann-tool__brush-size").val()) * scale);

        $(".workspace__canvas-box").css("left", "0px");
        $(".workspace__canvas-box").css("top", "0px");
    });
    $(".ann-tool__canvas-undo").click(function () {
        if (color_canvas_undo_data.length <= 1) return;
        color_canvas_redo_data.push(color_canvas_undo_data.pop());
        color_canvas_ctx.putImageData(color_canvas_undo_data[color_canvas_undo_data.length - 1], 0, 0);
        mask_canvas_redo_data.push(mask_canvas_undo_data.pop());
        mask_canvas_ctx.putImageData(mask_canvas_undo_data[mask_canvas_undo_data.length - 1], 0, 0);
        if (color_canvas_redo_data.length > 100) {
            color_canvas_redo_data = color_canvas_redo_data.slice(50, -1);
            mask_canvas_redo_data = mask_canvas_redo_data.slice(50, -1);
        }
        $(".ann-tool__undo-length").text(color_canvas_undo_data.length);
        $(".ann-tool__redo-length").text(color_canvas_redo_data.length);
    });
    $(".ann-tool__canvas-redo").click(function () {
        if (color_canvas_redo_data.length <= 0) return;
        color_canvas_undo_data.push(color_canvas_redo_data.pop());
        color_canvas_ctx.putImageData(color_canvas_undo_data[color_canvas_undo_data.length - 1], 0, 0);
        mask_canvas_undo_data.push(mask_canvas_redo_data.pop());
        mask_canvas_ctx.putImageData(mask_canvas_undo_data[mask_canvas_undo_data.length - 1], 0, 0);
        if (color_canvas_undo_data.length > 100) {
            color_canvas_undo_data = color_canvas_undo_data.slice(50, -1);
            mask_canvas_undo_data = mask_canvas_undo_data.slice(50, -1);
        }
        $(".ann-tool__undo-length").text(color_canvas_undo_data.length);
        $(".ann-tool__redo-length").text(color_canvas_redo_data.length);
    });
    $(".ann-tool__canvas-gen-water").click(function () {
        if ($(".workspace__color-canvas").data("isEmpty") == "false") {
            let imgData = mask_canvas_ctx.getImageData(0, 0, 960, 540);
            mask_canvas_dic[$(".workspace__frame-num").val()] = imgData;
            let mask_canvas_comped = pako.deflate(imgData.data);
            let mask_canvas_b64 = window.btoa(String.fromCharCode(...mask_canvas_comped));
            // https://www.cnblogs.com/zhangnan35/p/12433201.html
            $.post(
                "/send/gen_water",
                { num_now: $(".workspace__frame-num").val(), mask_canvas_b64: mask_canvas_b64 },
                function (data, status) {
                    const rawData = window.atob(data);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    let canvas_data = pako.inflate(outputArray);

                    let imgData = color_water_ctx.createImageData(960, 540);
                    for (let i = 0; i < canvas_data.length; i++) {
                        imgData.data[4 * i] = label_lut[0][canvas_data[i]][2];
                        imgData.data[4 * i + 1] = label_lut[0][canvas_data[i]][1];
                        imgData.data[4 * i + 2] = label_lut[0][canvas_data[i]][0];
                        imgData.data[4 * i + 3] = 255;
                    }
                    color_water_ctx.putImageData(imgData, 0, 0);
                    $(".workspace__color-water").css("visibility", "visible");
                    color_water_dic[$(".workspace__frame-num").val()] = imgData;
                }
            );
        }
    });
    $(".workspace__color-canvas").mousewheel(function (event) {
        if (event.shiftKey) {
            let scale = parseFloat(
                ($(".workspace__canvas-box")[0].style.transform || `scale(1)`).replace(/[^0-9.]/gi, "")
            );
            let size = event.deltaY * 0.1;
            if (scale + size >= 0.5) {
                $(".workspace__canvas-box")[0].style.transform = `scale(${scale + size})`;
                $(".ann-tool__brush-size").val((parseFloat($(".ann-tool__brush-size").val()) * scale) / (scale + size));
            }
            //原文链接：https://blog.csdn.net/qq_36281882/article/details/107056406
            // cursorMove(event);
        } else {
            let scale = parseFloat(
                ($(".workspace__cursor")[0].style.transform || `translate(-50%, -50%) scale(1)`)
                    .match(/scale\([0-9.]+\)/)[0]
                    .replace(/[^0-9.]/gi, "")
            );
            let size = event.deltaY * 0.1;
            $(".workspace__cursor")[0].style.transform = `translate(-50%, -50%) scale(${scale + size})`;

            $(".ann-tool__brush-size").val(parseInt($(".ann-tool__brush-size").val()) + event.deltaY);
            if ($(".ann-tool__brush-size").val() < 1) {
                $(".ann-tool__brush-size").val(1);
            } else if ($(".ann-tool__brush-size").val() > 50) {
                $(".ann-tool__brush-size").val(50);
            }
        }
    });
    $(".workspace__frame-num").on("change", function () {
        get_frame(parseInt($(this).val()));
    });
    $(".workspace__button-pre").click(function () {
        get_frame(parseInt($(".workspace__frame-num").val()) - 1);
    });
    $(".workspace__button-next").click(function () {
        get_frame(parseInt($(".workspace__frame-num").val()) + 1);
    });
    $(".workspace__button-pre-step").click(function () {
        get_frame(parseInt($(".workspace__frame-num").val()) - parseInt($(".workspace__frame-step").val()));
    });
    $(".workspace__button-next-step").click(function () {
        get_frame(parseInt($(".workspace__frame-num").val()) + parseInt($(".workspace__frame-step").val()));
    });
    $(".workspace__button-pre-keyframe").click(function () {
        for (let index = 0; index < keyframes.length; index++) {
            if (keyframes[index] > parseInt($(".workspace__frame-num").val()) - 1) {
                get_frame(keyframes[index - 1]);
                return;
            }
        }
        out_put("no pre-keyframe");
    });
    $(".workspace__button-next-keyframe").click(function () {
        for (let index = 0; index < keyframes.length; index++) {
            if (keyframes[index] > parseInt($(".workspace__frame-num").val())) {
                get_frame(keyframes[index]);
                return;
            }
        }
        out_put("no next-keyframe");
    });
    $(".page-body__button-get-keyframes").click(function () {
        $(".page-body__keyframes-info-box").html("<div>正在获取keyframes...</div>");
        var source = new EventSource("/ana_keyframes");
        source.onmessage = function (event) {
            out_put(event.data);
        };
        source.onerror = function (event) {
            source.close();
            out_put("source.error");
        };
        source.addEventListener("yield_end", function (event) {
            source.close();
            out_put(event.data);
            out_put("yield_end");
            $(".page-body__keyframes-info-box").html("<div>已加载keyframes</div>");
            get_frame(parseInt($(".workspace__frame-num").val()));
            $.ajax({
                type: "POST",
                url: "/get",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({ keys: ["keyframes", "diff_value_cut", "label_lut"] }),
                dataType: "json",
                success: function (data, status) {
                    if (data.keyframes) {
                        keyframes = data.keyframes;
                    }
                    if (data.diff_value) {
                        diff_value = data.diff_value;
                    }
                    if (data.label_lut) {
                        label_lut = data.label_lut;
                    }
                    get_frame(0);
                },
            });
        });
    });
    $(".ann-label__item").click(function () {
        $(".ann-label__item.active").removeClass("active");
        $(this).addClass("active");
        $(".workspace__cursor rect")[0].style.fill = $(".ann-label__item.active .ann-label__color").css(
            "background-color"
        );
    });
    $(".ann-label__color").colpick({
        layout: "hex",
        onChange: function (hsb, hex, rgb, el, bySetColor) {
            // console.log(hsb, hex, rgb, el, bySetColor);
            $(el).css("background-color", "#" + hex);
        },
    });
    $.ajax({
        type: "POST",
        url: "/get",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ keys: ["keyframes", "diff_value_cut", "label_lut"] }),
        dataType: "json",
        success: function (data, status) {
            if (data.keyframes) {
                keyframes = data.keyframes;
            }
            if (data.diff_value) {
                diff_value = data.diff_value;
            }
            if (data.label_lut) {
                label_lut = data.label_lut;
            }
            get_frame(0);
        },
    });

    mask_canvas_ctx = $(".workspace__mask-canvas")[0].getContext("2d");
    color_canvas_ctx = $(".workspace__color-canvas")[0].getContext("2d");
    color_water_ctx = $(".workspace__color-water")[0].getContext("2d");
    canvas_redo_push();

    $(".ann-label__item:nth-child(2)").addClass("active");
    $(".workspace__cursor rect")[0].style.fill = $(".ann-label__item.active .ann-label__color").css("background-color");

    let height = $(".workspace__color-canvas")[0].getBoundingClientRect().height;
    $(".workspace__cursor")[0].style.transform = `translate(-50%, -50%) scale(${height / 540})`;

    $("body").keydown(function (event) {
        let char = String.fromCharCode(event.which).toLowerCase();
        if (label_key_map[char]) {
            $(".ann-label__item:nth-child(" + label_key_map[char] + ")").click();
        } else if (char == " ") {
            $(".ann-tool__canvas-gen-water").click();
        } else if (char == "a") {
            $(".workspace__button-pre-keyframe").click();
        } else if (char == "d") {
            $(".workspace__button-next-keyframe").click();
        } else if (char == "g") {
            $(".ann-tool__canvas-clear").click();
        } else if (char == "s") {
            $(".ann-tool__color-water-visible").prop("checked", !$(".ann-tool__color-water-visible").prop("checked"));
            $(".ann-tool__color-water-visible").change();
        } else {
            return;
        }
        out_put("keydown: " + char);
    });
});
