// Bulk Import page - CSV file upload and processing
(function () {
  'use strict';

  const csvFileInput = document.getElementById('csvFile');
  const uploadBtn = document.getElementById('uploadBtn');
  const progressCard = document.getElementById('progressCard');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const processedCount = document.getElementById('processedCount');
  const successCount = document.getElementById('successCount');
  const errorCount = document.getElementById('errorCount');
  const totalCount = document.getElementById('totalCount');
  const errorList = document.getElementById('errorList');
  const errorListItems = document.getElementById('errorListItems');

  let csvData = [];
  let isProcessing = false;

  // File input değiştiğinde
  csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB
        alert('Dosya boyutu 50MB\'dan büyük olamaz!');
        csvFileInput.value = '';
        uploadBtn.disabled = true;
        return;
      }
      uploadBtn.disabled = false;
    } else {
      uploadBtn.disabled = true;
    }
  });

  // Upload butonu tıklandığında
  uploadBtn.addEventListener('click', async () => {
    const file = csvFileInput.files[0];
    if (!file) {
      alert('Lütfen bir CSV dosyası seçin!');
      return;
    }

    if (isProcessing) {
      alert('İşlem devam ediyor, lütfen bekleyin...');
      return;
    }

    try {
      await processCSVFile(file);
    } catch (err) {
      console.error('CSV işleme hatası:', err);
      alert('Dosya işlenirken bir hata oluştu: ' + err.message);
    }
  });

  // CSV dosyasını parse et ve işle
  async function processCSVFile(file) {
    isProcessing = true;
    uploadBtn.disabled = true;
    progressCard.style.display = 'block';
    resetProgress();

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (results) => {
          try {
            csvData = results.data;
            const total = csvData.length;
            
            if (total === 0) {
              alert('CSV dosyası boş veya geçersiz!');
              isProcessing = false;
              uploadBtn.disabled = false;
              return;
            }

            totalCount.textContent = total;
            updateProgress(0, total);

            // Chunk'lara böl (1000'er 1000'er)
            const chunkSize = 1000;
            const chunks = [];
            for (let i = 0; i < csvData.length; i += chunkSize) {
              chunks.push(csvData.slice(i, i + chunkSize));
            }

            let processed = 0;
            let success = 0;
            let errors = [];

            // Her chunk'ı işle
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              
              try {
                const result = await uploadChunk(chunk, i + 1, chunks.length);
                processed += chunk.length;
                success += result.success || 0;
                
                if (result.errors && result.errors.length > 0) {
                  errors = errors.concat(result.errors);
                }

                updateProgress(processed, total, success, errors.length);
              } catch (err) {
                console.error(`Chunk ${i + 1} işleme hatası:`, err);
                errors.push({
                  chunk: i + 1,
                  message: err.message || 'Bilinmeyen hata'
                });
                processed += chunk.length;
                updateProgress(processed, total, success, errors.length);
              }
            }

            // İşlem tamamlandı
            isProcessing = false;
            uploadBtn.disabled = false;

            if (errors.length > 0) {
              showErrors(errors);
            }

            // Başarı mesajı
            const message = `İşlem tamamlandı!\nBaşarılı: ${success}\nHatalı: ${errors.length}\nToplam: ${total}`;
            alert(message);

            // Sayfayı yenile (isteğe bağlı)
            // window.location.reload();

          } catch (err) {
            console.error('CSV işleme hatası:', err);
            reject(err);
          }
        },
        error: (error) => {
          console.error('CSV parse hatası:', error);
          alert('CSV dosyası okunamadı: ' + error.message);
          isProcessing = false;
          uploadBtn.disabled = false;
          reject(error);
        }
      });
    });
  }

  // Chunk'ı backend'e gönder
  async function uploadChunk(chunk, chunkNumber, totalChunks) {
    try {
      const response = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          assets: chunk,
          chunkNumber,
          totalChunks
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Chunk yüklenemedi');
      }

      return data;
    } catch (err) {
      console.error('Chunk upload hatası:', err);
      throw err;
    }
  }

  // Progress güncelle
  function updateProgress(processed, total, success = 0, error = 0) {
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
    progressText.textContent = percentage + '%';
    processedCount.textContent = processed;
    successCount.textContent = success;
    errorCount.textContent = error;
  }

  // Progress sıfırla
  function resetProgress() {
    updateProgress(0, 0, 0, 0);
    errorList.style.display = 'none';
    errorListItems.innerHTML = '';
  }

  // Hataları göster
  function showErrors(errors) {
    if (errors.length === 0) return;

    errorList.style.display = 'block';
    errorListItems.innerHTML = '';

    // İlk 50 hatayı göster
    const displayErrors = errors.slice(0, 50);
    displayErrors.forEach((error, index) => {
      const li = document.createElement('li');
      li.textContent = `Satır ${error.row || error.chunk || index + 1}: ${error.message || 'Bilinmeyen hata'}`;
      errorListItems.appendChild(li);
    });

    if (errors.length > 50) {
      const li = document.createElement('li');
      li.className = 'text-muted';
      li.textContent = `... ve ${errors.length - 50} hata daha`;
      errorListItems.appendChild(li);
    }
  }
})();

