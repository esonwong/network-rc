# 硬件测试

## 音视频流
### 视频抓取格式
ffmpeg -f video4linux2 -list_formats all /dev/video0
### 流
ffmpeg -f alsa -ar 16000 -ac 1 -i "" -f video4linux2 -s 400x300 -r 15 -i /dev/video0 -c:v h264_omx -profile:v baseline -f mpegts tcp://0.0.0.0:8097

ffmpeg -f alsa -ar 16000 -ac 1 -i "" -f video4linux2 -input_format h264 -s 400x300 -r 15 -i /dev/video0 -c:v copy -f mpegts udp://10.0.0.9:6666


