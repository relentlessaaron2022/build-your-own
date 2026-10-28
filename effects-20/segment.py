"""segment.py frames_dir masks_dir — person mask per frame (MediaPipe selfie segmentation), smoothed over time, saved as 8-bit PNG."""
import sys, os, glob, cv2, numpy as np, mediapipe as mp
src, dst = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(src, 'f*.jpg')))
prev = None
with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0) as seg:
    for f in files:
        img = cv2.imread(f); m = seg.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).segmentation_mask
        m = cv2.GaussianBlur(m, (0, 0), 1.2)
        if prev is not None: m = .6 * m + .4 * prev        # damp flicker
        prev = m
        a = np.clip((m - .35) / .3, 0, 1)                    # soft threshold
        cv2.imwrite(os.path.join(dst, os.path.basename(f).replace('.jpg', '.png')), (a * 255).astype(np.uint8))
print(len(files), 'masks')
