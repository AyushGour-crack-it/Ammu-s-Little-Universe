const uploadForm = document.querySelector('#memory-upload-form');
const fileInput = document.querySelector('#memory-files');
const selectionNode = document.querySelector('#upload-selection');
const statusNode = document.querySelector('#upload-status');
const dropZone = document.querySelector('#upload-drop');
const categoryButtons = [...document.querySelectorAll('.upload-category')];
let selectedKind = 'photo';

const acceptedTypes = {
  photo: 'image/*',
  video: 'video/*',
  voice: 'audio/*',
  other: '*/*',
};

const renderSelectedFiles = () => {
  const files = [...fileInput.files];
  selectionNode.replaceChildren();
  if (!files.length) {
    selectionNode.textContent = 'No files picked yet.';
    statusNode.classList.remove('is-visible');
    statusNode.textContent = 'This preview shows the upload flow; private cloud saving will be connected later.';
    return;
  }
  const summary = document.createElement('span');
  summary.textContent = `${files.length} ${files.length === 1 ? 'file' : 'files'} selected for the ${selectedKind === 'voice' ? 'voice note' : selectedKind} shelf:`;
  const list = document.createElement('ul');
  files.forEach((file) => {
    const item = document.createElement('li');
    item.textContent = file.name;
    list.append(item);
  });
  selectionNode.append(summary, list);
};

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedKind = button.dataset.kind;
    categoryButtons.forEach((choice) => {
      const isSelected = choice === button;
      choice.classList.toggle('is-selected', isSelected);
      choice.setAttribute('aria-pressed', String(isSelected));
    });
    fileInput.accept = selectedKind === 'other' ? '' : acceptedTypes[selectedKind];
    fileInput.value = '';
    renderSelectedFiles();
  });
});

fileInput.addEventListener('change', renderSelectedFiles);

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('is-dragging');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('is-dragging');
  });
});

dropZone.addEventListener('drop', (event) => {
  const droppedFiles = [...(event.dataTransfer?.files || [])];
  if (!droppedFiles.length) return;
  const transfer = new DataTransfer();
  droppedFiles.forEach((file) => transfer.items.add(file));
  fileInput.files = transfer.files;
  renderSelectedFiles();
});

uploadForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!fileInput.files.length) {
    statusNode.textContent = 'Pick one or more files first, and they’ll appear in this preview.';
  } else {
    statusNode.textContent = 'Lovely. This preview has your selection, but it has not been uploaded or saved. We’ll connect private storage when we build the real archive.';
  }
  statusNode.classList.add('is-visible');
});
