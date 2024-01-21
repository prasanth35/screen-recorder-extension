let localOverlayStream,
  rafId,
  mediaRecorder,
  audioContext,
  audioDestination;
let screen;
let cam;
let localScreenStream = null;
let localCamStream = null;
let mediaWrapperDiv = document.getElementById("mediaWrapper");
let recordedChunks = [];
let audioTracks = [];
let selectedVideoFormat;
// let encoderOptions = { mimeType: "video/webm; codecs=vp9" };
let canvasElement = document.createElement("canvas");
let canvasCtx = canvasElement.getContext("2d");



/**
 * @function startRecording
 * @description This function handles recording of video.
 * - If tab Index is 1 (i.e screen and camera) combinedStream function will be called.This function starts both the camera and the screen recorder. 
 */

async function startRecording() {
  const audioFormat = document.getElementById("audio-format-selector").value;
  const tabIndex = getActiveTab();
  selectedVideoFormat = document.getElementById("video-format-selector").value;
  if (tabIndex == 1) {
    hideHomeScreenAndShowDownload();
    combinedStream();
  } else {
    hideHomeScreenAndShowDownload();
    startScreenShare(true);
  }
}

/**
 * @function stopRecording
 * @description This function stops all the userMedia and the displayMedias.
 * This handles the visibility of the download button.
 */
function stopRecording() {
  [
    ...(localCamStream ? localCamStream.getTracks() : []),
    ...(localScreenStream ? localScreenStream.getTracks() : []),
    ...(localOverlayStream ? localOverlayStream.getTracks() : []),
  ].map((track) => track.stop());

  localCamStream = null;
  localScreenStream = null;
  localOverlayStream = null;
  cancelVideoFrame(rafId);
  mediaWrapperDiv.innerHTML = "";
  showDownloadButton();
  playRecordedVideo();
}

/**
 * @function startScreenShare
 * @description This function is used to start the screen-share api with getDisplayMedia from navigator.
 */
async function startScreenShare(recordScreenOnly) {
  const videoQuality = document.getElementById('video-quality-selector').value
  localScreenStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
        width: { ideal: videoQuality },
        height: { ideal: videoQuality },
    },
    audio: true,
});
  if (localScreenStream) {
    screen =  (await createNewDomElement("justScreenShare", localScreenStream))

    if(recordScreenOnly){
    screen.style.display = "block"
    mediaRecorder = new MediaRecorder(localScreenStream);
    mediaRecorder.ondataavailable = (e) => {
      console.log("pushing data")
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    mediaRecorder.start();
  }
}
}

/**
 * @function startWebcam
 * @description This function is used to start the webcam api with getUserMedia from navigator.
 */
async function startWebcam() {
const videoQuality = document.getElementById('video-quality-selector').value
localCamStream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: videoQuality },
            height: { ideal: videoQuality },
        },
        audio: { deviceId: { ideal: "communications" } },
    });
  if (localCamStream) {
    cam = await createNewDomElement("justWebcam", localCamStream);
  }
}


async function combinedStream() {
  await startScreenShare(false);
  await startWebcam();
  await makeComposite();

  //Todo need to fix audio context


  // if (!audioContext) {
  //   audioContext = new AudioContext();
  // }

  let fullVideoStream = canvasElement.captureStream();

  // audioDestination = audioContext.createMediaStreamDestination();
  // let existingAudioStreams = [
  //   ...(localCamStream ? localCamStream.getAudioTracks() : []),
  //   ...(localScreenStream ? localScreenStream.getAudioTracks() : []),
  // ];
  // audioTracks.push(
  //   audioContext.createMediaStreamSource(
  //     new MediaStream([existingAudioStreams[0]])
  //   )
  // );
  // if (existingAudioStreams.length > 1) {
  //   audioTracks.push(
  //     audioContext.createMediaStreamSource(
  //       new MediaStream([existingAudioStreams[1]])
  //     )
  //   );
  // }
  // audioTracks.map((track) => track.connect(audioDestination));
  localOverlayStream = new MediaStream([...fullVideoStream.getVideoTracks()]);
  let fullOverlayStream = new MediaStream([
    ...fullVideoStream.getVideoTracks(),
    // ...audioDestination.stream.getTracks(),
  ]);

  if (localOverlayStream) {
    overlay = await createNewDomElement("pipOverlayStream", localOverlayStream);
    mediaRecorder = new MediaRecorder(fullOverlayStream);
    mediaRecorder.ondataavailable = (e) => {
      console.log("pushing data")
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    mediaRecorder.start();
  }
}

/**
 * @function download
 * @description This function is used to download the recorded video.
 */
function download() {
  const currentDate = new Date();
  const fileName = `screen-recorder-${currentDate
    .toISOString()
    .replace(/[:.]/g, "-")}.${selectedVideoFormat}`;
  var blob = new Blob(recordedChunks, {
    type: `video/${selectedVideoFormat}`,
  });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}



/**
 * @function showDownloadButton
 * @description hides the selection menu and displays the video of the screen recording.
 * this is triggered when startRecording is called.
 */
function hideHomeScreenAndShowDownload() {
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("record-button").style.display = "none";
  document.getElementById("stop-recording").style.display = "block";
  document
    .getElementById("stop-recording")
    .addEventListener("click", stopRecording);
}

/**
 * @function showDownloadButton
 * @description hides the stop recording button and displays the download button with the file size.
 * this is triggered when stop download is called.
 */
//Todo - Need to fix size of the chunk
function showDownloadButton() {
  const recordedBlob = new Blob(recordedChunks, { type: `video/${selectedVideoFormat}`, })
	const fileSizeBytes = recordedBlob?.size;
	const fileSizeHumanReadable = formatBytes(fileSizeBytes);
  document.getElementById("stop-recording").style.display = "none";
  document.getElementById("download-recording").style.display = "block";
  document.getElementById("download-recording").addEventListener("click", download);
  document.getElementById('download-recording').textContent = `Download Recording: ${fileSizeHumanReadable+"kb"}`;
}

/**
 * @function playRecordedVideo
 * @description This function plays the recorded video in the "recordedVideo" element.
 */
function playRecordedVideo() {
  const recordedVideoElement = document.getElementById("recordedVideo");
  recordedVideoElement.style.display = "block";
  const blob = new Blob(recordedChunks, {
    type: `video/${selectedVideoFormat}`,
  });
  recordedVideoElement.src = URL.createObjectURL(blob);
  recordedVideoElement.play();
}


/**
 * Utilities Section
 */
function cancelVideoFrame (id) {
  clearTimeout(id);
};


const requestVideoFrame = function (callback) {
  return window.setTimeout(function () {
    callback(Date.now());
  }, 1000 / 60);
};

function getActiveTab() {
  for (const [index, tab] of tabs.entries()) {
    if (tab.classList.contains("active")) {
      return index;
    }
  }
  return -1;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function createNewDomElement(id, stream) {
  let videoElem = document.createElement("video");
  videoElem.id = id;
  videoElem.width = 640;
  videoElem.height = 360;
  videoElem.autoplay = true;
  videoElem.setAttribute("playsinline", true);
  videoElem.srcObject = new MediaStream(stream.getTracks());
  mediaWrapperDiv.appendChild(videoElem);
  videoElem.style.display = id === 'pipOverlayStream' ? 'block' : 'none';
  return videoElem;
}



async function makeComposite() {
  if (cam && screen) {
    canvasCtx.save();
    canvasElement.setAttribute("width", `${screen.videoWidth}px`);
    canvasElement.setAttribute("height", `${screen.videoHeight}px`);
    canvasCtx.clearRect(0, 0, screen.videoWidth, screen.videoHeight);
    canvasCtx.drawImage(screen, 0, 0, screen.videoWidth, screen.videoHeight);
    canvasCtx.drawImage(
      cam,
      0,
      Math.floor(screen.videoHeight - screen.videoHeight / 4),
      Math.floor(screen.videoWidth / 4),
      Math.floor(screen.videoHeight / 4)
    );
    let imageData = canvasCtx.getImageData(
      0,
      0,
      screen.videoWidth,
      screen.videoHeight
    );
    canvasCtx.putImageData(imageData, 0, 0);
    canvasCtx.restore();
    rafId = requestVideoFrame(makeComposite);
  }
}

window.addEventListener('load', () => {
  document.getElementById('record-button').addEventListener('click', startRecording);
  recordingScreen = document.getElementById('recording-screen');
});
