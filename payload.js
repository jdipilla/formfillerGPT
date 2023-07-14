// function formfillergpthelper(){
    let isRecording = false;
    let chunks = [];
    let micdata = [];
    let thisblob;
    let recorder;
    let mediaRecorder;
    let termsCheckbox;
    let thisFormFillerGPTform;
    let theseFormFillerGPTforms = [];
    let theseFormFillerGPTMics = [];
    let lastResponse;
    let countdownTimer;
    let countdownInterval;
    let thisPopupContainer

    function handleMicClick(event) {
        thisFormFillerGPTform = event.target.form
        dbg(['thisformsent',thisFormFillerGPTform,event,event.target,event.target.form])
        if (!isRecording) {
            launchPopup(event);
        } else {
            stopRecording();
            event.target.classList.remove('recording');
        }
    }
    function stopRecording() {
        let didstop = false
        clearInterval(countdownInterval);
        if(recorder && recorder.state !== 'inactive') {
            didstop = true
            recorder.stop();
            isRecording = false;
        }
        dbg(['didStop',didstop])
    }
    function startCountdown() {
        countdownTimer = 60;
        countdownInterval = setInterval(() => {
            countdownTimer--;
            document.querySelector('.formgpt-form-genie-timer').textContent = `Recording will stop in ${countdownTimer} seconds`;
            if (countdownTimer === 0) {
                stopRecording();
            }
        }, 1000);
    }
    function dbg(log){console.log(log);}
    function appendStyles() {
        const css = `
            .formgpt-form-genie-popup-container {
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .formgpt-form-genie-popup-content {
                width: 80%;
                max-width: 500px;
                background: #fff;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            @keyframes NOPEformgpt-form-genie-wiggle {
                0% { transform: rotate(0deg); }
                15% { transform: rotate(-7deg); }
                30% { transform: rotate(7deg); }
                45% { transform: rotate(-7deg); }
                60% { transform: rotate(7deg); }
                75% { transform: rotate(-7deg); }
                90% { transform: rotate(7deg); }
                100% { transform: rotate(0deg); }
            }
            .formgpt-form-genie {
                position: absolute;
                animation: formgpt-form-genie-wiggle 0.2s ease-in-out infinite;
                animation-delay: 3s; 
                transition: all 3.2s ease;
            }
            .formgpt-form-genie.recording {
                animation: none;
            }
            .formgpt-form-genie.complete {
                transform: scale(1.2);
            }
        `;

        const head = document.head || document.getElementsByTagName('head')[0];
        const style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
    }
    // Call the function to append the styles
    appendStyles();

    function grabFormData(form) {
        const formData = new FormData(form);
        return [...formData.entries()];
    }

    function sendAudio(sourceElement, chunks, event) {
        stopRecording();
        dbg(['sendingAudio',sourceElement,chunks,thisblob,micdata])
        const blob = new Blob(micdata, { 'type': 'audio/webm' }) // creates a blob from our audio chunks
        // Get form control elements
        // let formControls = getFormControls(sourceElement);
        
        // Get formData from formControls
        let formData = grabFormData(sourceElement);
    // console.log(blob);
        const data = new FormData();
        data.append('audio', blob);
        data.append('formdata', formData);
        data.append('formHTML', thisFormFillerGPTform.innerHTML);
        data.append('loc', window.location.href);
        data.append('path', window.location.pathname);
        data.append('host', window.location.hostname);
        data.append('hash', window.location.hash);

        // Replace this URL with your server-side processing URL
        fetch('https://formfillergpt.com', {
            method: 'POST',
            body: data
        })
        .then(response => response.json())
        .then(data => {
            data.forEach(field => {
                console.log(field)
                const input = thisFormFillerGPTform.querySelector(`[name="${field.fieldName}"]`);
                if(input) {
                    switch(field.fieldType) {
                        case 'text':
                        case 'textarea':
                        case 'password':
                        case 'email':
                        case 'tel':
                            input.value = field.fieldValue;
                            break;
                        case 'select-one':
                            for(let i = 0; i < input.options.length; i++) {
                                if(input.options[i].value == field.fieldValue) {
                                    input.selectedIndex = i;
                                    break;
                                }
                            }
                            break;
                        case 'radio':
                        case 'checkbox':
                            if(Array.isArray(field.fieldValue)) {
                                field.fieldValue.forEach(v => {
                                    if(input.value == v) {
                                        input.checked = true;
                                    }
                                });
                            } else {
                                if(input.value == field.fieldValue) {
                                    input.checked = true;
                                }
                            }
                            break;
                    }
                }
            });
            event.target.classList.remove('recording');
            event.target.classList.add('complete');
            document.body.removeChild(thisPopupContainer);
            setTimeout(() => {
                event.target.classList.remove('complete');
            }, 3000);
        })
        .catch(error => {
            console.error('An error occurred', error);
            event.target.classList.remove('recording');
        });
    }

    function isValidForm(form) {
        const visibleFields = form.querySelectorAll('input:not([type="hidden"]), select, textarea, button');
        const passwordInputs = form.querySelectorAll('input[type="password"]');
        const emailInputs = form.querySelectorAll('input[type="email"]');
        const searchInputs = Array.from(form.querySelectorAll('input')).filter(input => 
            ['search', 'query', 'q'].includes(input.name.toLowerCase()));

        // Exclude forms with 2 or less visible fields
        if(visibleFields.length <= 2) {dbg('2orless');return false;}

        // Exclude forms that seem to be login forms
        if(passwordInputs.length === 1 && visibleFields.length <= 3) {dbg('loginform');return false;} 

        // Exclude forms asking only for email (and possibly a submit button)
        if(emailInputs.length === 1 && visibleFields.length <= 2) {dbg('emailonlyform');return false;} 

        // Exclude search forms
        if(searchInputs.length === 1 && visibleFields.length <= 2) {dbg('searchform');return false;}

        // More rules can be added here...
        dbg('goodformfound');
        return true; // The form is valid
    }

    function launchPopup(event) {
        dbg('launchPopup')
        event.preventDefault();

        createPopup();
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('startedRecording')
                recorder = new MediaRecorder(stream);
                recorder.addEventListener('start', e => {
                    console.log('starting...')
                    micdata.length = 0;// Empty the collection when starting recording.
                    startCountdown();
                });
                recorder.addEventListener('dataavailable', event => {
                    console.log('adding...')
                    micdata.push(event.data);// Push recorded data to collection.
                });
                recorder.addEventListener('stop', () => {
                    console.log('stopping...')
                    thisblob = new Blob(micdata, { 'type': 'audio/webm' })// Create a Blob when recording has stopped.
                });
                recorder.start();

            })
            .catch(error => {
                console.log(['ERRORMIC',error])
                console.error('Could not get user media', error);
            });
    }


    function createPopup() {
        if (document.querySelector('.formgpt-form-genie-popup-container')) {
            return; // Check if the popup already exists and return
        }
        // Check if the popup already exists and return
        if (document.querySelector('.formgpt-form-genie-popup-container')) {
            return;
        }
        let popupContainer = document.createElement('div');
        popupContainer.classList.add('formgpt-form-genie-popup-container');
        
        const popupContent = document.createElement('div');
        popupContent.classList.add('formgpt-form-genie-popup-content');
        
        const popupHeader = document.createElement('h3');
        popupHeader.textContent = "Speak out the form";
        
        // Create the wave form visual animated graphic
        const waveform = document.createElement('div');
        waveform.classList.add('formgpt-form-genie-waveform');
        
        // Create the countdown timer
        const timer = document.createElement('p');
        timer.classList.add('formgpt-form-genie-timer');
        
        // Create the buttons
        thisPopupContainer = popupContainer;
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('formgpt-form-genie-cancel');
        cancelButton.innerHTML = '✗';
        cancelButton.addEventListener('click', () => {
            stopRecording();
            document.body.removeChild(thisPopupContainer);
        });

        const submitButton = document.createElement('button');
        submitButton.classList.add('formgpt-form-genie-submit');
        submitButton.innerHTML = '✔';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('formgpt-form-genie-buttons');
        buttonsContainer.appendChild(cancelButton);
        buttonsContainer.appendChild(submitButton);

        submitButton.addEventListener('click', (event) => {
            if (termsCheckbox.checked) {
                // Checkbox is checked, proceed with the submission
                sendAudio(thisFormFillerGPTform, chunks, event);
                //chunks = []; // Reset chunks for the next recording
            } else {
                // Checkbox not checked, inform the user
                alert('Please accept the terms and conditions to proceed');
            }
        });
        // Create the terms of service checkbox and link
        termsCheckbox = document.createElement('input');
        termsCheckbox.type = 'checkbox';
        termsCheckbox.classList.add('formgpt-form-genie-terms-checkbox');

        const termsLabel = document.createElement('label');
        termsLabel.classList.add('formgpt-form-genie-terms-label');
        termsLabel.innerHTML = `You agree to let me use your voice to fill out the form out which requires sharing with third parties. The complete agreement can be found <a href="https://example.com/terms-of-service" target="_blank">here</a>.`;
        termsLabel.insertBefore(termsCheckbox, termsLabel.firstChild);

        popupContent.appendChild(popupHeader);
        popupContent.appendChild(waveform);
        popupContent.appendChild(timer);
        popupContent.appendChild(buttonsContainer);
        popupContent.appendChild(termsLabel);
        popupContainer.appendChild(popupContent);

        // Append the popup to the body
        document.body.appendChild(popupContainer);
    }

    // Method to get all form elements in the container
    function getFormControls(container) {
        return container.querySelectorAll('input, select, textarea, button');
    }

    function appendMicrophoneToForm() {
        document.querySelectorAll('form').forEach(form => {
            if(form.getAttribute('data-processed') === 'true') {dbg('wasprocessed');return;}
            form.setAttribute('data-processed', 'true');
            theseFormFillerGPTforms.push(form);
            if(!isValidForm(form)) {dbg('noforms');return;} 
        
            const magicButtonContainer = document.createElement('div');
            magicButtonContainer.classList.add('formgpt-form-genie');
            
            const magicButton = document.createElement('button');
            magicButton.classList.add('formgpt-form-genie-mic');
            magicButton.innerHTML = '🎤'; 
            magicButton.addEventListener('click', handleMicClick);
            
            magicButtonContainer.appendChild(magicButton);
        
            const firstField = form.querySelector('input:not([type="hidden"]), select, textarea');
        
            let targetElement = firstField.parentElement;
        
            // Adjust button to the exact position of the firstField
            magicButtonContainer.style.position = 'absolute';
            const firstFieldRect = firstField.getBoundingClientRect();
            const targetElementRect = targetElement.getBoundingClientRect();
            magicButtonContainer.style.left = `${firstFieldRect.left - targetElementRect.left}px`;
            magicButtonContainer.style.top = `${firstFieldRect.top - targetElementRect.top}px`;
        
            // Set opacity and z-index
            magicButtonContainer.style.opacity = '0.5';
            magicButtonContainer.style.zIndex = '999';
        
            // Append the button to the first field's parent
            targetElement.appendChild(magicButtonContainer);
        
            // If parent's position is 'static', it won't affect the absolute positioning of the button
            const parentPosition = getComputedStyle(targetElement).position;
            if (['static', 'initial', 'inherit'].includes(parentPosition)) {
                targetElement.style.position = 'relative';
            }
        
            // theseFormFillerGPTMics.push(magicButtonContainer);
            console.log(form, magicButtonContainer)
        });
    }

    appendMicrophoneToForm(); // Run once at the start
    // setInterval(appendMicrophoneToForm, 5000); // Then run every 5 seconds
// }