// script.js

document.addEventListener('DOMContentLoaded', function () {
    const webcamElement = document.getElementById('webcam');
    const predictionsTable = document.getElementById('predictions').getElementsByTagName('tbody')[0];

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

            predictionsTable.innerHTML = ''; // Clear previous predictions

            result.forEach(prediction => {
                const row = predictionsTable.insertRow();
                const cellClass = row.insertCell(0);
                const cellProbability = row.insertCell(1);

                cellClass.textContent = prediction.className;
                cellProbability.textContent = prediction.probability.toFixed(4);
            });

            await tf.nextFrame();
        }
    }

    app();
});
