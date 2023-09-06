exports.home = (req, res) => {
    res.status(200).render("home", {
        listingName: "Available Item List",
        items: [],
    })
}
