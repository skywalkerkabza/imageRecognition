// script.js

document.addEventListener('DOMContentLoaded', function () {
    const webcamElement = document.getElementById('webcam');
    const predictionsElement = document.getElementById('predictions');

    async function setupWebcam() {
        return new Promise((resolve, reject) => {
            const navigatorAny = navigator;
            navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
            if (navigator.getUserMedia) {
                navigator.getUserMedia({ video: true },
                    stream => {
                        webcamElement.srcObject = stream;
                        webcamElement.addEventListener('loadeddata', () => resolve(), false);
                    },
                    error => reject());
            } else {
                reject();
            }
        });
    }

    async function app() {
        console.log('Loading mobilenet..');

        // Load the model.
        const model = await mobilenet.load();
        console.log('Successfully loaded model');

        await setupWebcam();
        while (true) {
            const result = await model.classify(webcamElement);

            predictionsElement.innerText = '';
            result.forEach(prediction => {
                const listItem = document.createElement('li');
                listItem.innerText = `${prediction.className}: ${prediction.probability.toFixed(4)}`;
                predictionsElement.appendChild(listItem);
            });

            await tf.nextFrame();
        }
    }

    app();
});
