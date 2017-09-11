let fs = require("fs");
let readline = require('readline');

function judgeInput(booking) {
    let bookingSplit = booking.split(' ');
    let bookingInfo;

    if (bookingSplit.length < 4 || bookingSplit.length > 5) {

        console.log('Error: the booking is invalid!');

        return;
    }

    fs.open('booking.txt', 'a+', function () {
        fs.readFile('booking.txt', function (err, data) {
            if (err) {
                return console.error(err);
            }

            let info = require('./allInfo').info;
            bookingInfo = data.toString() === '' ? {bookings: [], total: 0} : JSON.parse(data);

            if (bookingSplit.length === 4) {
                bookPlace(bookingSplit, info, bookingInfo);

                return;
            }
            if (bookingSplit.length === 5) {
                cancelBooking(bookingSplit, bookingInfo);

                return;
            }
            console.log('Error: the booking is invalid!');
        });
    });
}

function bookPlace(bookingSplit, info, bookingInfo) {
    console.log(judgeConflict(bookingSplit, bookingInfo));
    if (judgeDate(bookingSplit[1]) && judgeTime(bookingSplit[2]) && judgeChar(bookingSplit.slice(3)) && judgeConflict(bookingSplit, bookingInfo).flag) {

        let subPrice = calculateSubPrice(bookingSplit, info);

        let item = {
            date: bookingSplit[1],
            time: bookingSplit[2],
            subPrice: subPrice,
            cancel: false
        };

        judgePlace(bookingSplit[3], bookingInfo, item);

        return;
    }
    if (!judgeConflict(bookingSplit, bookingInfo).flag) {
        console.log('Error: the booking conflicts with existing bookings!');
    }
}

function cancelBooking(bookingSplit, bookingInfo) {
    if (judgeDate(bookingSplit[1]) && judgeTime(bookingSplit[2]) && judgeChar(bookingSplit.slice(3, 4))) {
        let res = judgeConflict(bookingSplit, bookingInfo);
        if (res.flag) {
            console.log('Error: the booking being cancelled does not exist!');

            return;
        }
        let newBookingInfo = getPenalty(res.index, bookingSplit, bookingInfo, info);
        writeBookingToFile(newBookingInfo);
    }
}
function getPenalty(index, bookingSplit, bookingInfo, info) {
    let dateStr = bookingSplit[1].split('-');

    let startTime = parseInt(bookingSplit[2].split('~')[0]);
    let endTime = parseInt(bookingSplit[2].split('~')[1]);

    let newDate = new Date(parseInt(dateStr[0]), parseInt(dateStr[1]) - 1, parseInt(dateStr[2]), startTime, 0, 0);
    let day = newDate.getDay();
    let cancelPrice;

    switch (day) {
        case 0:
        case 6:

            cancelPrice = getCancelPrice(info.weekdays, startTime, endTime);
            break;
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:

            cancelPrice = getCancelPrice(info.weeks, startTime, endTime);
            break;
    }

    for (let i = 0; i < bookingInfo.bookings.length; i++) {
        if (bookingInfo.bookings[i].place === bookingSplit[3]) {
            bookingInfo.bookings[i].items[`${index}`].subPrice -= cancelPrice;
            bookingInfo.bookings[i].items[`${index}`].cancel = true;
            bookingInfo.bookings[i].subTotal -= cancelPrice;
            bookingInfo.total -= cancelPrice;

            break;
        }
    }
    return bookingInfo;
}

function getCancelPrice(infoArr, startTime, endTime) {
    for (let i = 0; i < infoArr.length; i++) {
        let start = parseInt(infoArr[i].time.split('~')[0]);
        let end = parseInt(infoArr[i].time.split('~')[1]);

        if ((startTime >= start) && startTime < end && (endTime <= end)) {
            let timePart = endTime - startTime;

            return timePart * infoArr[i].price * infoArr[i].discount;
        }

        if (startTime >= start && startTime < end && endTime > end) {
            return (end - startTime) * infoArr[i].price * infoArr[i].discount + getCancelPrice(infoArr, end, endTime);
        }
    }
}

function judgePlace(bookingPlace, bookingInfo, item) {
    switch (bookingPlace) {
        case 'A':
            let subTotal1 = calculateSubTotal('A', bookingInfo, item);
            calculateTotal(subTotal1);

            break;
        case 'B':
            let subTotal2 = calculateSubTotal('B', bookingInfo, item);
            calculateTotal(subTotal2);

            break;
        case 'C':
            let subTotal3 = calculateSubTotal('C', bookingInfo, item);
            calculateTotal(subTotal3);

            break;
        case 'D':
            let subTotal4 = calculateSubTotal('D', bookingInfo, item);
            calculateTotal(subTotal4);

            break;
    }
}

function calculateTotal(bookingInfo) {
    let allTotal = 0;
    for (let i = 0; i < bookingInfo.bookings.length; i++) {

        allTotal += bookingInfo.bookings[i].subTotal;
    }
    bookingInfo.total = allTotal;

    writeBookingToFile(bookingInfo);

}

function writeBookingToFile(subTotal) {
    fs.writeFile('booking.txt', JSON.stringify(subTotal), function (err) {
        if (err) {
            return console.error(err);
        }
        console.log('Success: the booking is accepted!');
    });
}

function calculateSubTotal(place, bookingInfo, item) {
    let items = [];
    items.push(item);

    if (bookingInfo.bookings.length === 0) {
        bookingInfo.bookings.push({
            place: `${place}`,
            items: items,
            subTotal: item.subPrice
        });
        return bookingInfo;
    }

    for (var i = 0; i < bookingInfo.bookings.length; i++) {

        if (place === bookingInfo.bookings[i].place) {
            bookingInfo.bookings[i].items.push(item);
            bookingInfo.bookings[i].subTotal += item.subPrice;

            return bookingInfo;
        }
    }
    if (i === bookingInfo.bookings.length) {
        bookingInfo.bookings.push({
            place: `${place}`,
            items: items,
            subTotal: item.subPrice
        });

        return bookingInfo;
    }
}

function calculateSubPrice(bookingSplit, info) {

    let dateStr = bookingSplit[1].split('-');
    let timeStr = bookingSplit[2].split('~');

    let startTime = parseInt(timeStr[0].split(':')[0]);
    let endTime = parseInt(timeStr[1].split(':')[0]);

    let newDate = new Date(parseInt(dateStr[0]), parseInt(dateStr[1]) - 1, parseInt(dateStr[2]), startTime, 0, 0);
    let day = newDate.getDay();

    switch (day) {
        case 0:
        case 6:

            return getPrice(info.weekdays, startTime, endTime);
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            return getPrice(info.weeks, startTime, endTime);
    }
}

function getPrice(infoArr, startTime, endTime) {
    for (let i = 0; i < infoArr.length; i++) {
        let start = parseInt(infoArr[i].time.split('~')[0]);
        let end = parseInt(infoArr[i].time.split('~')[1]);

        if ((startTime >= start) && startTime < end && (endTime <= end)) {

            return (endTime - startTime) * infoArr[i].price;
        }

        if (startTime >= start && startTime < end && endTime > end) {

            return (end - startTime) * infoArr[i].price + getPrice(infoArr, end, endTime);
        }
    }
}

function judgeDate(date) {
    let dateRegExp = /^((?:19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    let dateArr = date.split('-');

    if (dateRegExp.test(date) && parseInt(dateArr[0]) % 4 === 0 && dateArr[1] === '02') {
        return parseInt(dateArr[2]) < 30;
    }

    if (dateRegExp.test(date) && dateArr[1] === '02') {

        return parseInt(dateArr[2]) < 29;
    }

    return dateRegExp.test(date);
}

function judgeTime(time) {
    let timeRegExp = /[01][0-9]|2[0-3]:00~[01][0-9]|2[0-3]:00$/;
    let timeArr = time.split('~');


    return timeRegExp.test(time) && (parseInt(timeArr[1]) <= parseInt(timeArr[0])) ? false : timeRegExp.test(time);
}

function judgeChar(charArr) {
    let charRegExp = /^[ABCD][C]{0,1}$/;

    return charRegExp.test(charArr);
}

function judgeConflict(bookingSplit, bookingInfo) {
    let place = bookingSplit[3];

    if (bookingInfo.bookings.length === 0) {

        return {flag: true, index: null};
    }

    for (var j = 0; j < bookingInfo.bookings.length; j++) {
        for (var i = 0; i < bookingInfo.bookings[j].items.length; i++) {
            if (place === bookingInfo.bookings[j].place && bookingSplit[1] != bookingInfo.bookings[j].items[i].date) {

                continue;
            }

            if (place === bookingInfo.bookings[j].place && bookingSplit[1] === bookingInfo.bookings[j].items[i].date) {
                let startTime = parseInt(bookingSplit[2].split('~')[0]);
                let endTime = parseInt(bookingSplit[2].split('~')[1]);

                let start = parseInt(bookingInfo.bookings[j].items[i].time.split('~')[0]);
                let end = parseInt(bookingInfo.bookings[j].items[i].time.split('~')[1]);

                if (bookingSplit.length === 4) {

                    if (!(endTime <= start || (startTime >= end)) && !bookingInfo.bookings[j].items[i].cancel) {
                        return {flag: false, index: i};
                    }

                } else if (bookingSplit.length === 5) {
                    if (startTime === start && endTime === end && !bookingInfo.bookings[j].items[i].cancel) {

                        return {flag: false, index: i};
                    }
                }

            }
        }
    }

    if (j === bookingInfo.bookings.length) {

        return {flag: true, index: null};
    }
}

function printSubTotal(bookings) {
    let text = '';

    for (let i = 0; i < bookings.items.length; i++) {
        let items = bookings.items[i];
        text += items.date + ' ' + items.time;
        text += items.cancel ? ' 违约金' + ' ' + items.subPrice + '元\n' : ' ' + items.subPrice + '元\n';
    }
    text += '小计: ' + bookings.subTotal + '元\n';

    return text;
}

function print() {
    fs.open('booking.txt', 'a+', function () {
        fs.readFile('booking.txt', function (err, data) {
            if (err) {
                return console.error(err);
            }
            let bookingInfo =  data.toString() === '' ? {bookings: [], total: 0} : JSON.parse(data);

            let text = '收入汇总\n' + '---\n';
            let textA = '', textB = '', textC = '', textD = '';

            for (let i = 0; i < bookingInfo.bookings.length; i++) {
                switch (bookingInfo.bookings[i].place) {
                    case 'A':
                        textA += printSubTotal(bookingInfo.bookings[i]);

                        break;
                }
                switch (bookingInfo.bookings[i].place) {
                    case 'B':
                        textB += printSubTotal(bookingInfo.bookings[i]);

                        break;
                }
                switch (bookingInfo.bookings[i].place) {
                    case 'C':
                        textC += printSubTotal(bookingInfo.bookings[i]);

                        break;
                }
                switch (bookingInfo.bookings[i].place) {
                    case 'D':
                        textD += printSubTotal(bookingInfo.bookings[i]);

                        break;
                }
            }

            textA += textA === '' ? '小计:0元\n' : '';
            textB += textB === '' ? '小计:0元\n' : '';
            textC += textC === '' ? '小计:0元\n' : '';
            textD += textD === '' ? '小计:0元\n' : '';

            text += '场地:A\n' + textA + '\n场地:B\n' + textB + '\n场地:C\n' + textC + '\n场地:D\n' + textD + '---\n' + '总计: ' + bookingInfo.total + '元';
            console.log(text);
        });
    });

}

let rl = readline.createInterface(process.stdin, process.stdout);

rl.setPrompt('> ');
rl.prompt(' ');

rl.on('line', function (line) {
    switch (line) {
        case ' ':
            print();
            rl.close();
            break;
        default:
            judgeInput(line);
            break;
    }
    rl.prompt('> ');
});

module.exports = {
    judgeInput
};

