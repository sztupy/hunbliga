const startMoney = 1000000;
const now = Date.now(); //Date.parse('2023-03-25 00:00:00'); //Date.now();
const currentVersion = 2;
const activePos = 2;

let data = {};
let scoreData = {};
let validity = now;
let money = 1000000;
let oldCode = null;
let basket = {};
let current = {};

function upgradeData(version, data) {
    if (version == 1) {
        let result = { 1: [] };
        for (let booking of data) {
            let amount = booking[0];
            let newBooking = {};

            for (let key in booking[1]) {
                newBooking[key.replaceAll('_','')] = booking[1][key][0];
            }

            result[1].push([amount, newBooking]);
        }
        return result;
    }
    return data;
}

function updateMoney() {
    document.getElementById("remaining_money").innerHTML = `Ŧ${money.toLocaleString('hu-HU')}`;
}

function betSlipToString(version, slip) {
    let odds = 1;

    let result = '';
    let winlose = 1;
    for (let key in slip) {
        let type = key[0];
        let id = key.substring(1);
        let thread = data[version].find(item => item.id == id);

        let name = "<strong>'" + thread.name + "'</strong>";

        let odd = thread.odds[type][slip[key]];

        odds = odds * odd;

        if (type=='W') {
            let wl = scoreData['W'][slip[key]][thread.id];
            if (wl == -1) winlose = -1;
            if (wl != 1 && winlose == 1) winlose = 0;
            if (slip[key] == 1) {
                result += `<div class="${getWinLoseClass(wl)}">${name} megnyeri a bajnokságot: ${odd}</div>`;
            } else if (slip[key] <= 4) {
                result += `<div class="${getWinLoseClass(wl)}">${name} bekerül a legjobb ${slip[key]}-be: ${odd}</div>`;
            } else {
                result += `<div class="${getWinLoseClass(wl)}">${name} bekerül a legjobb ${slip[key]}-ba: ${odd}</div>`;
            }

        } else if (type=='A') {
            let wl = scoreData['A'][slip[key]][thread.id];
            if (wl == -1) winlose = -1;
            if (wl != 1 && winlose == 1) winlose = 0;
            if (slip[key] == 0) {
                result += `<div class="${getWinLoseClass(wl)}">${name} nyer: ${odd}</div>`;
            } else {
                result += `<div class="${getWinLoseClass(wl)}">${name} nyer legalább ${slip[key]}%-al: ${odd}</div>`;
            }
        } else if (type=='B') {
            let wl = scoreData['B'][slip[key]][thread.id];
            if (wl == -1) winlose = -1;
            if (wl != 1 && winlose == 1) winlose = 0;
            if (slip[key] == 0) {
                result += `<div class="${getWinLoseClass(wl)}">${name} veszít: ${odd}</div>`;
            } else {
                result += `<div class="${getWinLoseClass(wl)}">${name} veszít legalább ${slip[key]}%-al: ${odd}</div>`;
            }
        }
    }

    if (result == '') {
        result = 'Válassz tétet a jobb oldali odds-okra kattintva. ';
    }

    return [parseFloat(odds.toFixed(2)),result,winlose];
}

function updateCurrent() {
    const currentList = document.getElementById("current_list");
    const currentOdds = document.getElementById("current_odds");
    const currentWin = document.getElementById("current_win");
    const currentMoney = document.getElementById('current_money');

    currentMoney.max = money;
    if (currentMoney.value > money) {
        currentMoney.value = money;
    }
    if (currentMoney.value < 1000) {
        currentMoney.value = 1000;
    }

    let [odds,result] = betSlipToString(activePos,current);

    currentList.innerHTML = result;

    let betMoney = parseInt(currentMoney.value) * parseFloat(odds.toFixed(2));

    currentOdds.innerHTML = odds.toFixed(2);
    currentWin.innerHTML = `Ŧ${betMoney.toLocaleString('hu-HU')}`;
}

function DownloadCanvasAsImage(){
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'BettingSlip.png');
    let canvas = document.getElementById('slip_export');
    canvas.toBlob(function(blob) {
      let url = URL.createObjectURL(blob);
      downloadLink.setAttribute('href', url);
      downloadLink.click();
    });
}

function putPixel(id, x,y, r,g,b) {
    let pixels = id.data;
    var off = (y * id.width + x) * 4;
    pixels[off] = r;
    pixels[off + 1] = g;
    pixels[off + 2] = b;
    pixels[off + 3] = 255;
}

function putLargePixel(id, x,y, r,g,b) {
    for (let xx=0; xx<=2; xx++)
        for (let yy=0; yy<=2; yy++)
            putPixel(id,x+xx,y+yy,r,g,b);
}

function updateBasket() {
    const basketDom = document.getElementById("basket");

    let content = '<div>';
    let totalBet = 0;

    for (let pos in basket) {
        if (pos == 'old') continue;
        for (let slipData of basket[pos]) {
            let bet = slipData[0];
            let slip = slipData[1];

            let [odds,result,winlose] = betSlipToString(pos, slip);

            let betMoney = bet * parseFloat(odds.toFixed(2));

            content += `<div class="slip ${getWinLoseClass(winlose)}"><div class="money"><strong>Feltett pénz</strong>: Ŧ${bet.toLocaleString('hu-HU')}</div><div class="slip_list">`;
            content += result;
            content += `</div><div><strong>Odds</strong>: ${odds.toFixed(2)}</div><div><strong>Potenciális nyeremény</strong>: Ŧ${(betMoney.toLocaleString('hu-HU'))}</div></div>`;

            totalBet += bet;
        }
    }

    content += '</div>';
    basketDom.innerHTML = content;

    basket['old'] = (oldCode ? oldCode : '');

    var basketCode = JSON.stringify(basket);
    var hash = CryptoJS.MD5(basketCode);
    var hashString = hash.toString(CryptoJS.enc.Base64).replace("==","");

    basketCode = currentVersion + '|' + hashString + '|' + basketCode;

    const canvas = document.getElementById("slip_export");

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 540, 200);

    ctx.fillStyle = "#000000";
    ctx.font = "14px monospace";
    ctx.fillText(hashString, 10, 20);

    if (oldCode) {
        ctx.fillText(oldCode, 10, 180);
    }

    let countBet = 0;
    for (let key in basket) {
        if (key!='old') {
            countBet += basket[key].length;
        }
    }

    ctx.font = "14px sans-serif";
    ctx.fillText(`Hunbliga fogadási bizonylat ${currentVersion}.0`, 10, 50);
    ctx.fillText(`Érvényes: ${new Date(validity).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' } )}`, 10, 70);
    ctx.fillText(`Fogadások száma: ${countBet}`, 10, 90);
    ctx.fillText(`Feltett összeg: Ŧ${(totalBet.toLocaleString('hu-HU'))}`, 10, 110);
    ctx.fillText(`Fennmaradt pénz: Ŧ${(money.toLocaleString('hu-HU'))}`, 10, 130);

    if (oldCode) {
        ctx.fillText("Csak az alábbival érvényes:", 10, 160);
    }

    var id = ctx.getImageData(0, 0, 540, 200);

    let xpos = 520;
    let ypos = 180;
    for (var i = 0; i < basketCode.length; i+=3) {
        let r = basketCode.charCodeAt(i) * 2;
        let g = basketCode.charCodeAt(i+1) * 2;
        let b = basketCode.charCodeAt(i+2) * 2;

        if (isNaN(r)) r = 0;
        if (isNaN(g)) g = 0;
        if (isNaN(b)) b = 0;

        putLargePixel(id, xpos, ypos, r,g,b);
        xpos-=3;

        if(xpos<=260) {
            xpos = 520;
            ypos -= 3;
        }
    }

    ctx.putImageData(id, 0, 0);
}

document.getElementById("slip_export").onclick = DownloadCanvasAsImage;
document.getElementById("current_money").onchange = updateCurrent;

function resetCurrent() {
    current = {};
    for (let elem2 of document.getElementsByTagName("td")) {
        elem2.classList.remove("selected");
    }

    money = startMoney;

    for (let b in basket) {
        if (b!='old') {
            for (let item of basket[b]) {
                let bet = item[0];
                let slip = item[1];

                let [odds,result,winlose] = betSlipToString(b, slip);

                money -= item[0];

                if (winlose == 1) {
                    money += item[0] * odds;
                }
            }
        }
    }

    updateMoney();
    updateCurrent();
    updateBasket();
}

document.getElementById("current_bet").onclick = function() {
    let empty = true;

    for (let _ in current) {
        empty = false;
        break;
    }

    if (empty) return;

    const currentMoney = document.getElementById('current_money');

    currentMoney.max = money;
    if (currentMoney.value > money) {
        currentMoney.value = money;
    }
    if (currentMoney.value < 1000) {
        currentMoney.value = 1000;
    }

    let value = parseInt(currentMoney.value);

    if (value <= money) {
        basket[activePos] ||= [];
        basket[activePos].push([parseInt(currentMoney.value), current]);
    }

    resetCurrent();
}

document.getElementById('inp').onchange = function(e) {
    var img = new Image();
    img.onload = loadDraw;
    img.onerror = loadFailed;
    img.src = URL.createObjectURL(this.files[0]);
};

function loadDraw() {
    var canvas = document.getElementById('load_canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(this, 0,0);

    var id = ctx.getImageData(0, 0, 540, 200);

    let data = '';

    let x = 521;
    let y = 181;

    let r = -1;
    let g = -1;
    let b = -1;
    while (r != 127.5 && r != 0) {
        let pixels = id.data;
        var off = (y * id.width + x) * 4;

        r = pixels[off] / 2;
        g = pixels[off + 1] / 2;
        b = pixels[off + 2] / 2;

        if (b!=0 && b != 127.5) {
            data += String.fromCharCode(r,g,b);
        } else if (g!=0 && g != 127.5) {
            data += String.fromCharCode(r,g);
        } else if (r!=0 && r != 127.5) {
            data += String.fromCharCode(r);
        }

        x-=3;
        if (x <= 260) {
            x = 521;
            y -= 3;
        }
        if (y<0) break;
    }

    let elements = data.split('|');
    let checksum = elements[1];
    var hash = CryptoJS.MD5(elements[2]);
    var hashString = hash.toString(CryptoJS.enc.Base64).replace("==","");
    console.log(data);
    if (checksum != hashString) {
        console.log("Invalid checksum! Not importing");
        console.log(elements);
        console.log(checksum);
        console.log(hashString);
        alert("Hibás képfájl!");
        return;
    }

    basket = upgradeData(parseInt(elements[0]), JSON.parse(elements[2]));
    oldCode = elements[1];

    resetCurrent();
    updateCurrent();
    updateBasket();
}
function loadFailed() {
    console.error("The provided file couldn't be loaded as an Image media");
}

function getWinLoseClass(pos) {
    if (pos == 1) return 'win';
    if (pos == -1) return 'lose';
    return '';
}

function postDownload() {
    const dataDom = document.getElementById("winner_table_body");
    const tournDom = document.getElementById("round_table_body");

    for (let positions = activePos; positions>=1; positions--) {
        let latest = positions == activePos;

        for (let thread of data[positions]) {
            thread.score = thread.rounds[0].points + thread.rounds[0].diff * 0.1;
            if (thread.rounds[1].points) {
                thread.score += thread.rounds[1].points + thread.rounds[1].diff * 0.1;
            }
            if (thread.score < 0) thread.score = 0;
        }

        let scores = data[positions].filter(item => item.rounds[2].time).sort((a,b) => a.name > b.name ? 1 : -1);

        let totalPoints = scores.reduce((sum,thread) => sum + thread.score, 0);

        for (let thread of scores) {
            let klass = '';
            if (thread.rounds[2].time < now) {
                klass = 'class="disabled"';
            }

            let result = `<tr ${klass}><td>${thread.name}</td>`;

            thread.odds ||= {};
            thread.odds['W'] ||= {};

            for (let pos of [16,8,4,2,1]) {
                let oddsWin = 1 + ((totalPoints / pos)-thread.score) / thread.score / 2;
                if (oddsWin < 1) oddsWin = 1.01;

                thread.odds['W'][pos] = parseFloat(oddsWin.toFixed(2));

                if (latest) {
                    scoreData['W'] ||= {}
                    scoreData['W'][pos] ||= {}

                    if (pos == 16) {
                        if (thread.rounds[2].grp == 'X') {
                            scoreData['W'][pos][thread.id] = -1;
                        } else if (thread.rounds[2].grp == 'A') {
                            scoreData['W'][pos][thread.id] = 1;
                        }
                    }

                    result += `<td class="${getWinLoseClass(scoreData['W'][pos][thread.id])}" id="W_${thread.id}_${pos}">${oddsWin.toFixed(2)}</td>`;
                }
            }

            if (latest) {
                result += '</tr>';
                dataDom.innerHTML += result;
            }
        }


        let tournaments = data[positions].filter(item => item.rounds[2].pos == 1).sort((a,b) => a.rounds[2].time-b.rounds[2].time);

        for (let thread of tournaments) {
            let klass = '';
            if (thread.rounds[2].time < now) {
                klass = 'class="disabled"';
            }

            let result = `<tr ${klass}><td>${thread.name}</td>`;
            let score_a = thread.score;
            let thread_b = data[positions].find(item => item.id == thread.rounds[2].enid);
            let score_b = thread_b.score;
            let total = score_a + score_b;

            thread.odds ||= {};
            thread.odds['A'] ||= {};
            thread.odds['B'] ||= {};

            for (let pos of [50,33,25,10,0]) {
                let oddsWin = 1 + Math.abs((total - score_a + score_b * (pos/100)) / (score_a - score_b * (pos/100)) / 2);

                thread.odds['A'][pos] = parseFloat(oddsWin.toFixed(2));

                if (latest) {
                    scoreData['A'] ||= {}
                    scoreData['A'][pos] ||= {}
                    if (thread.rounds[2].grp == 'A') {
                        if (parseFloat(thread.rounds[2].pp) - 50 > pos/2) {
                            scoreData['A'][pos][thread.id] = 1
                        } else {
                            scoreData['A'][pos][thread.id] = -1
                        }
                    } else if (thread.rounds[2].points > 0) {
                        scoreData['A'][pos][thread.id] = -1
                    }
                    result += `<td class="${getWinLoseClass(scoreData['A'][pos][thread.id])}" id="A_${thread.id}_${pos}">${oddsWin.toFixed(2)}</td>`;
                }
            }
            for (let pos of [0,10,25,33,50]) {
                let oddsWin = 1 + Math.abs((total - score_b + score_a * (pos/100)) / (score_b - score_a * (pos/100)) / 2);

                thread.odds['B'][pos] = parseFloat(oddsWin.toFixed(2));

                if (latest) {
                    scoreData['B'] ||= {}
                    scoreData['B'][pos] ||= {}
                    if (thread_b.rounds[2].grp == 'A') {
                        if (parseFloat(thread_b.rounds[2].pp) - 50 > pos/2) {
                            scoreData['B'][pos][thread.id] = 1
                        } else {
                            scoreData['B'][pos][thread.id] = -1
                        }
                    } else if (thread_b.rounds[2].points > 0) {
                        scoreData['B'][pos][thread.id] = -1
                    }

                    result += `<td class="${getWinLoseClass(scoreData['B'][pos][thread.id])}" id="B_${thread.id}_${pos}">${oddsWin.toFixed(2)}</td>`;
                }
            }

            if (latest) {
                result += `<td>${thread.rounds[2].en}</td></tr>`;
                tournDom.innerHTML += result;
            }
        }

        if (latest) {
            validity = scores.reduce((min, item) => item.rounds[2].time > now ? (min > item.rounds[2].time ? item.rounds[2].time : min) : min, scores[0].rounds[2].time);
            document.getElementById("valid_time").innerHTML = `Oddsok érvényesek: ${new Date(validity).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' } )}`;
        }
    }

    updateMoney();
    updateCurrent();
    updateBasket();

    for (let elem of document.getElementsByTagName("td")) {
        if (elem.id.startsWith("W_") || elem.id.startsWith("A_") || elem.id.startsWith("B_")) {
            let elemIdPre = elem.id.split("_").splice(0,2).join("_") + "_";
            let elemIdPre2 = elemIdPre.replace('A','X').replace('B','Y').replace('X','B').replace('Y','A');

            let elemIdPost = parseInt(elem.id.split("_")[2]);

            let currIdPre = elemIdPre.replaceAll("_","");
            let currIdPre2 = elemIdPre2.replaceAll("_","");
            elem.onclick = function() {
                if (!elem.parentElement.classList.contains("disabled")) {
                    if (elem.classList.contains("selected")) {
                        elem.classList.remove("selected");
                        delete current[currIdPre];
                    } else {
                        for (let elem2 of document.getElementsByTagName("td")) {
                            if (elem2.id.startsWith(elemIdPre) || elem2.id.startsWith(elemIdPre2)) {
                                elem2.classList.remove("selected");
                            }
                        }
                        delete current[currIdPre];
                        delete current[currIdPre2];

                        current[currIdPre] = elemIdPost;

                        elem.classList.add("selected");
                    }
                    updateCurrent();
                }
            }
        }
    }
}

let downloaded = 0;
for (let positions = activePos; positions>=1; positions--) {
    let latest = positions == activePos;
    Papa.parse(`standings/${positions}.csv`, {
        download: true,
        header: true,
        dynamicTyping: true,
        transformHeader: function(name) {
            return name.toLowerCase().replace(" ","_").replace("%","pp")
        },
        transform: function(value, header) {
            if (header == "r3_time" && value) {
                let time = Date.parse(value.replace(/\s/,"T")+'Z') - 3600000;
                if (time > Date.parse('2023-03-26T01:00:00Z')) {
                    time -= 3600000;
                }
                return time;
            }
            return value;
        },
        step: function(results) {
            let obj = { rounds: [] };
            for (let key in results.data) {
                const found = key.match(/^r(\d)_(.*)$/);
                if (found) {
                    const round = parseInt(found[1])-1;
                    const roundKey = found[2];
                    obj.rounds[round] ||= {}
                    obj.rounds[round][roundKey] = results.data[key];
                } else {
                    obj[key] = results.data[key];
                }
            }
            if (obj.rounds[0]) {
                data[positions] ||= [];
                data[positions].push(obj);
            }
        },
        complete: function() {
            downloaded += 1;
            if (downloaded == activePos) {
                postDownload();
            }
        }
    });
}
