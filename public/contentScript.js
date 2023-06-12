console.log("content script injected")

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.from === "popup" && message.query === "eye_dropper_clicked") {

        setTimeout(() => {

            const eyeDropper = new EyeDropper();

            eyeDropper.open().then(result => {
                const color = result.sRGBHex;
                // Copy the color to the clipboard
                navigator.clipboard.writeText(color).then(function() {
                    // Success feedback
                    alert(`Color ${color} copied to clipboard`);
                }, function(err) {
                    // Handle errors
                    console.error('Could not copy color: ', err);
                });

                chrome.storage.local.get("color_hex_code", (resp) => {
                    if (resp.color_hex_code && resp.color_hex_code.length > 0) {
                        resp.color_hex_code.unshift(color); // новый цвет вставляется в начало массива
                        chrome.storage.local.set({ "color_hex_code": resp.color_hex_code }) // сохраняем обновленный массив
                    }
                    else {
                        chrome.storage.local.set({ "color_hex_code": [color] }) // если нет сохраненных цветов, создаем новый массив
                    }
                })
            }).catch(e => {
                console.log(e)
            })
        }, 500);
    }
})
