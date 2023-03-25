const startMoney = 1000000;
const now = Date.now(); //Date.parse('2023-03-25 00:00:00'); //Date.now();
const currentVersion = 2;
const activePos = 1;

let data = [];
let validity = now;
let money = 1000000;
let oldCode = null;
let basket = {}; basket[activePos] = [];
let current = {};

function upgradeData(version, data) {
    if (version == 1) {
        let result = { 1: []};
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

function betSlipToString(slip) {
    let odds = 1;

    let result = '';
    for (let key in slip) {
        let type = key[0];
        let id = key.substring(1);
        let thread = data.find(item => item.id == id);

        let name = "<strong>'" + thread.name + "'</strong>";

        let odd = thread.odds[type][slip[key]];

        odds = odds * odd;

        if (type=='W') {
            if (slip[key] == 1) {
                result += `<div>${name} megnyeri a bajnokságot: ${odd}</div>`;
            } else if (slip[key] <= 4) {
                result += `<div>${name} bekerül a legjobb ${slip[key]}-be: ${odd}</div>`;
            } else {
                result += `<div>${name} bekerül a legjobb ${slip[key]}-ba: ${odd}</div>`;
            }

        } else if (type=='A') {
            if (slip[key] == 0) {
                result += `<div>${name} nyer: ${odd}</div>`;
            } else {
                result += `<div>${name} nyer legalább ${slip[key]}%-al: ${odd}</div>`;
            }
        } else if (type=='B') {
            if (slip[key] == 0) {
                result += `<div>${name} veszít: ${odd}</div>`;
            } else {
                result += `<div>${name} veszít legalább ${slip[key]}%-al: ${odd}</div>`;
            }
        }
    }

    if (result == '') {
        result = 'Válassz tétet a jobb oldali odds-okra kattintva. ';
    }

    return [odds,result];
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

    let [odds,result] = betSlipToString(current);

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

    for (let slipData of basket[activePos]) {
        let bet = slipData[0];
        let slip = slipData[1];

        let [odds,result] = betSlipToString(slip);

        let betMoney = bet * parseFloat(odds.toFixed(2));

        content += `<div class="slip"><div class="money"><strong>Feltett pénz</strong>: Ŧ${bet.toLocaleString('hu-HU')}</div><div class="slip_list">`;
        content += result;
        content += `</div><div><strong>Odds</strong>: ${odds.toFixed(2)}</div><div><strong>Potenciális nyeremény</strong>: Ŧ${(betMoney.toLocaleString('hu-HU'))}</div></div>`;

        totalBet += bet;
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

    ctx.font = "14px sans-serif";
    ctx.fillText(`Hunbliga fogadási bizonylat ${currentVersion}.0`, 10, 50);
    ctx.fillText(`Érvényes: ${new Date(validity).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' } )}`, 10, 70);
    ctx.fillText(`Fogadások száma: ${basket[1].length}`, 10, 90);
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
                money -= item[0];
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

    basket[1].push([parseInt(currentMoney.value), current]);

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

Papa.parse('standings/1.csv', {
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
            data.push(obj);
        }
    },
    complete: function() {
        const dataDom = document.getElementById("winner_table_body");

        for (let thread of data) {
            thread.score = thread.rounds[0].points + thread.rounds[0].diff * 0.1;
            if (thread.rounds[1].points) {
                thread.score += thread.rounds[1].points + thread.rounds[1].diff * 0.1;
            }
            if (thread.score < 0) thread.score = 0;
        }

        let scores = data.filter(item => item.rounds[2].time).sort((a,b) => a.name > b.name ? 1 : -1);

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
                result += `<td id="W_${thread.id}_${pos}">${oddsWin.toFixed(2)}</td>`;
            }

            result += '</tr>';
            dataDom.innerHTML += result;
        }

        const tournDom = document.getElementById("round_table_body");
        let tournaments = data.filter(item => item.rounds[2].pos == 1).sort((a,b) => a.rounds[2].time-b.rounds[2].time);

        for (let thread of tournaments) {
            let klass = '';
            if (thread.rounds[2].time < now) {
                klass = 'class="disabled"';
            }

            let result = `<tr ${klass}><td>${thread.name}</td>`;
            let score_a = thread.score;
            let thread_b = data.find(item => item.id == thread.rounds[2].enid);
            let score_b = thread_b.score;
            let total = score_a + score_b;

            thread.odds ||= {};
            thread.odds['A'] ||= {};
            thread.odds['B'] ||= {};

            for (let pos of [50,33,25,10,0]) {
                let oddsWin = 1 + Math.abs((total - score_a + score_b * (pos/100)) / (score_a - score_b * (pos/100)) / 2);

                thread.odds['A'][pos] = parseFloat(oddsWin.toFixed(2));

                result += `<td id="A_${thread.id}_${pos}">${oddsWin.toFixed(2)}</td>`;
            }
            for (let pos of [0,10,25,33,50]) {
                let oddsWin = 1 + Math.abs((total - score_b + score_a * (pos/100)) / (score_b - score_a * (pos/100)) / 2);

                thread.odds['B'][pos] = parseFloat(oddsWin.toFixed(2));

                result += `<td id="B_${thread.id}_${pos}">${oddsWin.toFixed(2)}</td>`;
            }

            result += `<td>${thread.rounds[2].en}</td></tr>`;
            tournDom.innerHTML += result;
        }

        validity = scores.reduce((min, item) => item.rounds[2].time > now ? (min > item.rounds[2].time ? item.rounds[2].time : min)  : min, scores[0].rounds[2].time);

        document.getElementById("valid_time").innerHTML = `Oddsok érvényesek: ${new Date(validity).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' } )}`;

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
});
