const uploadForm = document.querySelector('#memory-upload-form');
const fileInput = document.querySelector('#memory-files');
const selectionNode = document.querySelector('#upload-selection');
const statusNode = document.querySelector('#upload-status');
const dropZone = document.querySelector('#upload-drop');
const categoryButtons = [...document.querySelectorAll('.upload-category')];
const titleField = uploadForm.querySelector('[name="memory-title"]');
const dateField = uploadForm.querySelector('[name="memory-date"]');
const noteField = uploadForm.querySelector('[name="memory-note"]');
const resultPanel = document.querySelector('#upload-preview-result');
let selectedKind = 'photo';

const acceptedTypes = {
  photo: 'image/*',
  video: 'video/*',
  voice: 'audio/*',
  other: '*/*',
};
const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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
  const shelfName = selectedKind === 'voice' ? 'voice note' : selectedKind === 'other' ? 'little thing' : selectedKind;
  summary.textContent = `${files.length} ${files.length === 1 ? 'file' : 'files'} selected for the ${shelfName} shelf:`;
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
    resultPanel.hidden = true;
    renderSelectedFiles();
  });
});

fileInput.addEventListener('change', () => { resultPanel.hidden = true; renderSelectedFiles(); });

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
    resultPanel.hidden = true;
  } else {
    const selectedDate = dateField.value || localToday();
    const files = [...fileInput.files];
    const sharedTitle = titleField.value.trim();
    const drafts = files.map((file, index) => ({
      kind: selectedKind === 'other' ? 'little-things' : selectedKind,
      title: sharedTitle ? files.length > 1 ? `${sharedTitle} · ${index + 1}` : sharedTitle : file.name.replace(/\.[^.]+$/, ''),
      date: selectedDate,
      caption: noteField.value.trim() || 'A little keepsake, ready for its diary page.',
    }));
    try { sessionStorage.setItem('little-diary-preview-draft', JSON.stringify(drafts)); } catch { /* The diary remains browsable when storage is unavailable. */ }
    statusNode.textContent = 'Preview only · no files have been uploaded or saved. See how this keepsake would sit in the diary.';
    resultPanel.hidden = false;
  }
  statusNode.classList.add('is-visible');
});
