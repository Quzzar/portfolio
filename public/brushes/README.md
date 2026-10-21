# Diagonal paint video matte

Author: Gam-Ol
Source: https://pixabay.com/videos/transition-brush-black-white-23325/
Downloaded media: https://cdn.pixabay.com/video/2019/05/05/23325-334689174_large.mp4
License: Pixabay Content License, https://pixabay.com/service/license-summary/
Retrieved: 2026-10-21

`diagonal-matte.mp4` is an adapted mask for this website's theme transition. It is
not offered as a standalone stock download. The source's diagonal paint motion is
preserved. Its initial blank segment is trimmed, playback is accelerated, resolution
is reduced, and luminance is remapped to ensure the final painted frame fully covers
the old theme. The app converts each video frame's luminance to alpha and uses it to
reveal the destination interface. It makes no third-party requests.

Reproduction from the downloaded source:

```sh
ffmpeg -i source.mp4 -vf "trim=start=0.65,setpts=(PTS-STARTPTS)*0.52,scale=960:540,format=gray,lut=y='clip((val-16)*255/150,0,255)',fps=30" -an -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart diagonal-matte.mp4
```

The former procedurally moved PNG stamps were rejected: their paths and repeated
edges looked mechanical. Their code and assets have been removed.
