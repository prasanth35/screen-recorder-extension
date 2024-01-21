const tabs = document.querySelectorAll('#tabs-header .tab');
const videoFormatSelector = document.getElementById('video-format-selector');
const audioFormatSelector = document.getElementById('audio-format-selector');
const videoQualitySelector = document.getElementById('video-quality-selector');

const resetOnSwitchTab = (currentTabIndex) => {
  const defaultOptions = {
    videoFormat: 'mp4',
    audioFormat: currentTabIndex === 0 ? 'system' : 'mic',
    videoQuality: '1080',
  };

  videoFormatSelector.value = defaultOptions.videoFormat;
  audioFormatSelector.value = defaultOptions.audioFormat;
  videoQualitySelector.value = defaultOptions.videoQuality;
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    resetOnSwitchTab(index);
    tab.classList.add('active');
  });
});

const optionsMap = {
  videoFormat: [
    { value: 'mp4', label: 'Mp4 Format' },
    { value: 'webm', label: 'Webm Format' },
  ],
  videoQuality: [
    { value: '1080', label: '1080p Quality' },
    { value: '720', label: '720p Quality' },
    { value: '480', label: '480p Quality' },
  ],
  audioFormat: [
    { value: 'system', label: 'System Audio' },
    { value: 'mic', label: 'Mic Audio' },
    { value: 'mic_system', label: 'Mic + System' },
    { value: 'none', label: 'None' },
  ],
};

window.addEventListener('load', () => {
  populateOptions(videoFormatSelector, optionsMap.videoFormat);
  populateOptions(videoQualitySelector, optionsMap.videoQuality);
  populateOptions(audioFormatSelector, optionsMap.audioFormat);
});

function populateOptions(selectElement, options) {
  options.forEach((data) => selectElement.add(new Option(data.label, data.value)));
}