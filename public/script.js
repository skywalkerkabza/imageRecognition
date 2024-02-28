const demosSection = document.getElementById('demos');
var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    // Show demo section now model is ready to use.
    demosSection.classList.remove('invisible');
});

// In this demo, we have put all our clickable images in divs with the 
// CSS class 'classifyOnClick'. Lets get all the elements that have
// this class.
const imageContainers = document.getElementsByClassName('classifyOnClick');

// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
    // Add event listener to the child element which is the img element.
    imageContainers[i].children[0].addEventListener('click', handleClick);
}

// When an image is clicked, let's classify it and display results!
function handleClick(event) {
    if (!model) {
        console.log('Wait for model to load before clicking!');
        return;
    }
  
    // We can call model.classify as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // print out the results of the prediction.
    model.detect(event.target).then(function (predictions) {
        // Lets write the predictions to a new paragraph element and
        // add it to the DOM.
        console.log(predictions);
        for (let n = 0; n < predictions.length; n++) {
            // Description text
            const p = document.createElement('p');
            p.innerText = predictions[n].class  + ' - with ' 
                + Math.round(parseFloat(predictions[n].score) * 100) 
                + '% confidence.';
            // Positioned at the top left of the bounding box.
            // Height is whatever the text takes up.
            // Width subtracts text padding in CSS so fits perfectly.
            p.style = 'left: ' + predictions[n].bbox[0] + 'px;' + 
                'top: ' + predictions[n].bbox[1] + 'px; ' + 
                'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

            const highlighter = document.createElement('div');
            highlighter.setAttribute('class', 'highlighter');
            highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                'top: ' + predictions[n].bbox[1] + 'px;' +
                'width: ' + predictions[n].bbox[2] + 'px;' +
                'height: ' + predictions[n].bbox[3] + 'px;';

            event.target.parentNode.appendChild(highlighter);
            event.target.parentNode.appendChild(p);
        }
    });
}

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easily on each render.
var children = [];

// If webcam supported, add event listener to button for when the user
// wants to activate it.
if (hasGetUserMedia()) {
    const enableWebcamButton = document.getElementById('webcamButton');
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
    if (!model) {
        console.log('Wait! Model not loaded yet.');
        return;
    }

    // Hide the button.
    event.target.classList.add('removed');  

    // getUsermedia parameters.
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

// Function to switch the camera
function switchCamera() {
    // Get the current video stream track
    const videoStream = video.srcObject;
    if (!videoStream) {
        console.log('No video stream available');
        return;
    }

    // Get all video input devices
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length < 2) {
                console.log('Only one camera available');
                return;
            }

            // Find the index of the currently active video device
            const currentDeviceIndex = videoDevices.findIndex(device => {
                return device.label === videoStream.getVideoTracks()[0].label;
            });

            // Calculate the index of the next camera to switch to
            const nextDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;

            // Get the next camera device
            const nextDeviceId = videoDevices[nextDeviceIndex].deviceId;

            // Create new constraints with the new camera device
            const constraints = {
                video: { deviceId: { exact: nextDeviceId } }
            };

            // Stop the current stream
            videoStream.getTracks().forEach(track => track.stop());

            // Get the new stream with the next camera
            return navigator.mediaDevices.getUserMedia(constraints);
        })
        .then(newStream => {
            // Set the new stream to the video element
            video.srcObject = newStream;
            video.addEventListener('loadeddata', predictWebcam);
        })
        .catch(error => {
            console.error('Error switching camera:', error);
        });
}

function predictWebcam() {
    // Now let's start classifying the stream.
    model.detect(video).then(function (predictions) {
        // Remove any highlighting we did previous frame.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // Now let's loop through predictions and draw them to the live view if
        // they have a high confidence score.
        for (let n = 0; n < predictions.length; n++) {
            // If we are over 66% sure we are sure we classified it right, draw it!
            if (predictions[n].score > 0.66) {
                const p = document.createElement('p');
                p.innerText = predictions[n].class  + ' - with ' 
                    + Math.round(parseFloat(predictions[n].score) * 100) 
                    + '% confidence.';
                // Draw in top left of bounding box outline.
                p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                    'top: ' + predictions[n].bbox[1] + 'px;' + 
                    'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

                // Draw the actual bounding box.
                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
                    + predictions[n].bbox[1] + 'px; width: ' 
                    + predictions[n].bbox[2] + 'px; height: '
                    + predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);

                // Store drawn objects in memory so we can delete them next time around.
                children.push(highlighter);
                children.push(p);
            }
        }

        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    });
}
