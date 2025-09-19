let recorder = null, chunks = [], stream = null;

export function startRecording(canvas, fps = 30) {
  try {
    stopRecordingSync();
    stream = canvas?.captureStream?.(fps);
    if (!stream) { console.warn('captureStream not supported'); return; }
    chunks = [];
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      ''
    ];
    const mimeType = mimeTypes.find(t => t && MediaRecorder.isTypeSupported?.(t)) || undefined;
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onerror = (e) => console.warn('Recorder error:', e);
    recorder.start(250); // timeslice to ensure chunks on iOS/Android
  } catch (e) { console.warn('Recorder start failed:', e); }
}

function stopRecordingSync() {
  try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch {}
  try { stream?.getTracks?.().forEach(t => t.stop()); } catch {}
  recorder = null; stream = null;
}

export function stopRecording() {
  return new Promise((resolve) => {
    const rec = recorder;
    if (!rec) return resolve(null);
    const finish = () => {
      const blob = chunks.length ? new Blob(chunks, { type: 'video/webm' }) : null;
      chunks = [];
      try { stream?.getTracks?.().forEach(t => t.stop()); } catch {}
      recorder = null; stream = null;
      resolve(blob);
    };
    const onStop = () => { rec.removeEventListener('stop', onStop); finish(); };
    rec.addEventListener('stop', onStop);
    let safety = setTimeout(()=>{ try{ rec.removeEventListener('stop', onStop);}catch{} finish(); }, 2000);
    try { rec.stop(); } catch { clearTimeout(safety); finish(); }
  });
}