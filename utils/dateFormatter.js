exports.dateFormattedInDDMMYYYHHMMSS = () => {
    let dateObject = new Date()

    let date = ("0" + dateObject.getDate()).slice(-2);
    let month = ("0" + (dateObject.getMonth() + 1)).slice(-2);
    let year = dateObject.getFullYear();

    let hours = ("0" + dateObject.getHours()).slice(-2);
    let minutes = ("0" + dateObject.getMinutes()).slice(-2);
    let seconds = ("0" + dateObject.getSeconds()).slice(-2);

    return `${date}-${month}-${year}_${hours}-${minutes}-${seconds}`
}