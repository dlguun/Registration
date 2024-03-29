﻿// JavaScript source code

// Global vars
let auth = firebase.auth();
let db = firebase.firestore();

// profile.html
if (window.location.pathname.endsWith('profile.html')) {
    console.log('Hello profile.html');
    
    auth.onAuthStateChanged((user) => {
        let first = document.querySelector('input:nth-child(1)');
        let last = document.querySelector('input:nth-child(2)');
        let color = document.querySelector('div #color');
        let promise = db.collection('users').doc(auth.currentUser.uid).get();

        promise.then((doc) => {
            if (doc.data()) {
                first.value = doc.data()['first-name'];
                last.value = doc.data()['last-name'];
                if (doc.data()['color']) color.value = doc.data()['color'];
            } else {
                first.value = '';
                last.value = '';
            }

            document.querySelector('button').onclick = () => {
                if (first.value && last.value) {
                    let temp = {
                        'first-name': first.value,
                        'last-name': last.value,
                        'color': color.value,
                    };

                    // Firebase storage
                    let file = document.querySelector('#img').files[0];
                    if (file) {
                        let storageRef = firebase.storage().ref();
                        storageRef.child('profile/' + user.uid + file.name).put(file).then((doc) => {
                            doc.ref.getDownloadURL().then((url) => {
                                temp.profile = url;
                                db.collection('users').doc(auth.currentUser.uid).set(temp, { merge: true }).then(() => {
                                    window.location.replace('index.html');
                                });
                            });
                        });
                    } else {
                        db.collection('users').doc(auth.currentUser.uid).set(temp, { merge: true }).then(() => {
                            window.location.replace('index.html');
                        });
                    }
                } else {
                    alert('Please check inputs');
                };
            };
        });
        promise.catch((error) => {
            console.log(error);
        });
    });
};

// login.html
if (window.location.pathname.endsWith('login.html')) {
    console.log('Hello login.html');
    document.querySelector('#sign-in').onclick = function () {
        let mail = document.querySelector('#mail').value;
        let pass = document.querySelector('#pass').value;
        auth.signInWithEmailAndPassword(mail, pass)
            .then((userCredential) => {
                window.location.replace('index.html');
            })
            .catch((error) => {
                alert(error);
            });
    };
    document.querySelector('#sign-up').onclick = function () {
        let mail = document.querySelector('#mail').value;
        let pass = document.querySelector('#pass').value;
        auth.createUserWithEmailAndPassword(mail, pass)
            .then((userCredential) => {
                window.location.replace('index.html');
            })
            .catch((error) => {
                alert(error);
            });
    };
};

// index.html
if (window.location.pathname.endsWith('index.html')) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Hello index.html');
            document.querySelector('h1 a').innerHTML = user.email;

            // Buttons
            document.querySelector('#sign-out').onclick = function () {
                auth.signOut()
                    .then(() => {
                        window.location.replace('login.html');
                    })
                    .catch((error) => {
                        alert(error);
                    });
            };
            document.querySelector('footer button').onclick = () => {
                db.collection('users').get().then((docs) => {
                    let users = [];
                    docs.forEach((doc) => {
                        users.push(doc);
                    });
                    let msgOwner = users.find((doc) => {
                        return doc.id === user.uid;
                    });
                    if (!msgOwner) {
                        alert('Please fill your information');
                        return;
                    };

                    let text = document.querySelector('footer input');
                    if (text.value) {
                        let msg = {
                            'owner': user.uid,
                            'text': text.value,
                            'date': new Date(),
                        };
                        db.collection('chat').add(msg).then(() => {
                            text.value = '';
                        });
                    };
                });
            };

            let lastVisible = '';
            document.querySelector('#more').onclick = () => {
                db.collection('chat').orderBy('date', 'desc').startAfter(lastVisible).limit(5).onSnapshot((docs) => {
                    console.log('ajillaw');
                    console.log(docs.docs.length);
                    lastVisible = docs.docs[docs.docs.length - 1];
                    if (!lastVisible) lastVisible = docs.docs[docs.docs.length];

                    docs.forEach((doc) => {
                        chat.unshift(doc.data());
                    });

                    document.querySelector('.general').innerHTML = '';
                    db.collection('users').get().then((docs) => {
                        let users = [];
                        docs.forEach((doc) => {
                            users.push(doc);
                        });

                        chat.forEach((item) => {
                            let msgOwner = users.find((doc) => {
                                return doc.id === item.owner;
                            });
                            drawMessage(item, msgOwner);
                        });
                    });
                });
            };

            function drawMessage(msg, msgOwner) {
                let $div = document.createElement('div');
                $div.className = 'chat';
                $div.innerHTML =
                    `<p>${msgOwner.data()['first-name']}</p>
                        <span class="profile">${msgOwner.data()['first-name'][0]}</span>
                        <span class="text">
                            ${msg.text}
                        </span>`;

                $div.querySelector('.profile').style.background = msgOwner.data().color;

                if (msg.owner === user.uid) $div.classList.add('owner');
                if (msgOwner.data().profile) {
                    $div.querySelector('.profile').style.backgroundImage = `url(${msgOwner.data().profile})`;
                    $div.querySelector('.profile').style.backgroundSize = `contain`;
                    $div.querySelector('.profile').style.backgroundRepeat = `no-repeat`;
                    $div.querySelector('.profile').style.backgroundPosition = `center`;
                    $div.querySelector('.profile').innerHTML = '';
                };

                let $chatbox = document.querySelector('.general');
                $chatbox.append($div);
            };

            // From firestore
            var chat = [];
            let isStart = true;
            db.collection('chat').orderBy('date', 'desc').startAfter(lastVisible).limit(5).onSnapshot((docs) => {
                lastVisible = docs.docs[docs.docs.length - 1];
                if (!lastVisible) lastVisible = docs.docs[docs.docs.length];
                
                docs.forEach((doc) => {
                    let temp = chat.find((item) => {
                        return item.id === doc.id;
                    });

                    if (!temp) {
                        let msg = doc.data();
                        msg.id = doc.id;
                        if (isStart) chat.unshift(msg);
                        else chat.push(msg);
                    };
                });
                isStart = false;

                document.querySelector('.general').innerHTML = '';
                db.collection('users').get().then((docs) => {
                    let users = [];
                    docs.forEach((doc) => {
                        users.push(doc);
                    });

                    chat.forEach((item) => {
                        let msgOwner = users.find((doc) => {
                            return doc.id === item.owner;
                        });
                        drawMessage(item, msgOwner);
                    });

                    let chatBox = document.querySelector('html');
                    chatBox.scrollTo(0, chatBox.scrollHeight + 1000);
                    chatBox.scrollIntoView(false);
                    //document.querySelector('.general').scrollIntoView(false);
                    //document.querySelector('.general').scrollTop = document.querySelector('.general').scrollHeight;
                    console.log('from bottom');
                });
                
            });
            
        } else {
            window.location.replace('login.html');
        }
    });
};