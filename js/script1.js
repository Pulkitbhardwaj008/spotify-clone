console.log("Welcome to spotify");

let currentsong = new Audio();
let songs = []; // Initialize as an empty array
let currfolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to fetch song names from the server
async function getsongs(folder) {
    currfolder = folder;
    let response = await fetch(`http://127.0.0.1:3000/${folder}/`);

    if (!response.ok) {
        console.error("Failed to fetch songs:", response.statusText);
        return [];
    }

    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${currfolder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; // Clear previous songs

    for (const song of songs) {
        songUL.innerHTML += `<li>
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Pulkit</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const clickedSongName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            const matchedFile = songs.find(s => decodeURI(s) === clickedSongName);
            if (matchedFile) {
                playMusic(matchedFile);
            } else {
                console.error("Song not found in list", clickedSongName);
            }
        });
    });
}

const playMusic = (track, pause = false) => {
    currentsong.src = `/${currfolder}/` + track;
    if (!pause) {
        currentsong.play();
        document.getElementById("play").src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayalbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    let cardcontainer = document.querySelector(".cardcontainer")
    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs")) {
            let folder = (e.href.split("/").slice(-2)[0])
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json.`)
            let response = await a.json();
            cardcontainer.innerHTML = cardcontainer.innerHTML + ` <div data-folder="ncs" class="card">
                        <div class="play">
                            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="45" fill="#1ED760" />
                                <polygon points="40,30 40,70 70,50" fill="black" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="Song">
                        <h2>${response.title}</h2>
                        <p>${response.descriptio}</p>
                    </div>`
        }
    })
}

async function main() {
    await getsongs("songs/cs");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    displayalbums()

    document.getElementById("play").addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            document.getElementById("play").src = "img/pause.svg";
        } else {
            currentsong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    const firstCard = document.querySelector(".cardcontainer .card");
    if (firstCard) {
        const firstFolder = firstCard.dataset.folder;
        await getsongs(`songs/${firstFolder}`); // Step 3: Songs fetch karo
        if (songs.length > 0) {
            playMusic(songs[0], true); // Step 4: Pehla song set karo, play nahi
        }
    }

    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    currentsong.addEventListener("ended", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]); // Loop back to the first song
        }
    });


    function seek(e) {
        let clientX = e.clientX || (e.touches && e.touches[0].clientX); // Support touch too
        let seekbar = document.querySelector(".seekbar");
        let rect = seekbar.getBoundingClientRect();

        let percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent)); // Clamp 0–100%

        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (percent / 100) * currentsong.duration;
    }

    // ✅ Add both mouse and touch support
    document.querySelector(".seekbar").addEventListener("click", seek);
    document.querySelector(".seekbar").addEventListener("touchstart", seek);


    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            const folder = item.currentTarget.dataset.folder;
            await getsongs(`songs/${folder}`);
            if (songs.length > 0) {
                playMusic(songs[0]); // ⬅️ Ye line add ki — autoplay first song
            }
        });
    });


    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
            currentsong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
            currentsong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
    document.addEventListener("keydown", (e) => {
        // Prevent scrolling when space is pressed
        if (["Space", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }

        // ⏩ Right Arrow – Forward 10 sec
        if (e.key === "ArrowRight") {
            currentsong.currentTime = Math.min(currentsong.currentTime + 10, currentsong.duration);
        }

        // ⏪ Left Arrow – Backward 10 sec
        if (e.key === "ArrowLeft") {
            currentsong.currentTime = Math.max(currentsong.currentTime - 10, 0);
        }

        // ⏯️ Spacebar – Play / Pause
        if (e.code === "Space") {
            if (currentsong.paused) {
                currentsong.play();
                document.getElementById("play").src = "pause.svg";
            } else {
                currentsong.pause();
                document.getElementById("play").src = "play.svg";
            }
        }
    });

}

main();