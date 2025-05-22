const maxFiles = 5;
let uploadedFiles = [];

$(document).ready(function() {
    // 处理文件选择
    $('#fileInput').on('change', function(e) {
        handleFiles(e.target.files);
    });

    // 处理拖放
    $('#dropZone').on('dragover', function(e) {
        e.preventDefault();
        $(this).css('border-color', '#666');
    }).on('dragleave', function(e) {
        e.preventDefault();
        $(this).css('border-color', '#ccc');
    }).on('drop', function(e) {
        e.preventDefault();
        $(this).css('border-color', '#ccc');
        handleFiles(e.originalEvent.dataTransfer.files);
    });

    // 添加生成按钮
    $('.container').append(`
        <button class="generateBtn" onclick="generateImages()">生成图片</button>
    `);
});

function handleFiles(files) {
    uploadedFiles = [];
    $('#previewArea').empty();
    $('#resultArea').empty();
    if (uploadedFiles.length + files.length > maxFiles) {
        showError(`最多只能上传${maxFiles}张图片`);
        return;
    }

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showError('请只上传图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedFiles.push({
                file: file,
                preview: e.target.result,
                numindex: uploadedFiles.length
            });
            updatePreview();
        };
        reader.readAsDataURL(file);
    });
}

function updatePreview() {
    const previewArea = $('#previewArea');
    previewArea.empty();

    uploadedFiles.forEach((item, index) => {
        const previewItem = $(`
            <div class="preview-item">
                <img src="${item.preview}" alt="预览图">
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
        `);
        previewArea.append(previewItem);
    });

    if (uploadedFiles.length > 0) {
        $('#error').text('');
    }
}

// 删除预览图片
$(document).on('click', '.remove-btn', function() {
    const index = $(this).data('index');
    const numindex = uploadedFiles[index].numindex;
    uploadedFiles.splice(index, 1);
    updatePreview();
    if ($("#result-item-" + numindex).length) {
        $("#result-item-" + numindex).remove();
    }
});

async function generateImages() {
    if (uploadedFiles.length === 0) {
        showError('请先上传图片');
        return;
    }

    $('#loading').show();
    $('#error').text('');
    $('#resultArea').empty();

    for (let item of uploadedFiles) {
        try {
            const formData = new FormData();
            formData.append('image', item.file);

            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('生成失败');
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            const resultItem = $(`
                <div class="result-item" id="result-item-${item.numindex}">
                    <img src="data:image/png;base64,${data.image_data}" alt="生成结果">
                </div>
            `);
            $('#resultArea').append(resultItem);

        } catch (error) {
            showError('生成图片时出错：' + error.message);
        }
    }

    $('#loading').hide();
}

function showError(message) {
    $('#error').text(message);
} 