document.querySelectorAll('form').forEach(form => {
    const magicButton = document.createElement('button');
    magicButton.classList.add('magic-form-mic');
    magicButton.innerHTML = '🎤'; // replace with your icon
    magicButton.addEventListener('click', handleMicClick);

    const firstInput = form.querySelector('input');
    form.insertBefore(magicButton, firstInput);
});

let isRecording = false;
let chunks = [];
let mediaRecorder;

function handleMicClick(event) {
    if (!isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                isRecording = true;
                event.target.classList.add('recording');

                mediaRecorder.ondataavailable = e => {
                    chunks.push(e.data);
                };
            }).catch(error => {
                console.error('Could not get user media', error);
            });
    } else {
        mediaRecorder.stop();
        isRecording = false;
        event.target.classList.remove('recording');
        sendAudio(event.target.form, chunks);
        chunks = []; // Reset chunks for the next recording
    }
}

function grabFormData(form) {
    const formData = new FormData(form);
    return [...formData.entries()];
}

function sendAudio(form, chunks) {
    const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
    const formData = grabFormData(form);

    const data = new FormData();
    data.append('audio', blob);
    data.append('form', JSON.stringify(formData));

    // Replace this URL with your server-side processing URL
    fetch('50.17.113.42/formGPT', {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(data => {
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name=${key}]`);
            if(input) {
                switch(input.type) {
                    case 'text':
                    case 'textarea':
                    case 'password':
                    case 'email':
                        input.value = value;
                        break;
                    case 'select-one':
                        for(let i = 0; i < input.options.length; i++) {
                            if(input.options[i].value === value) {
                                input.selectedIndex = i;
                                break;
                            }
                        }
                        break;
                    case 'radio':
                    case 'checkbox':
                        if(Array.isArray(value)) {
                            value.forEach(v => {
                                if(input.value === v) {
                                    input.checked = true;
                                }
                            });
                        } else {
                            if(input.value === value) {
                                input.checked = true;
                            }
                        }
                        break;
                }
            }
        });
        event.target.classList.remove('recording');
        event.target.classList.add('complete');
        setTimeout(() => {
            event.target.classList.remove('complete');
        }, 3000);
    })
    .catch(error => {
        console.error('An error occurred', error);
        event.target.classList.remove('recording');
    });
}

