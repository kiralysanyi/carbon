const fs = require("fs");

function createPage(errorCode, description, retry_url) {
    return ("data:text/html;charset=utf-8,<!DOCTYPE html>\
    <html>\
    <head><title>Error</title><style>" + fs.readFileSync(__dirname + "/style.css", {encoding: "utf-8"}) + "</style></head>\
    <body>\
    <p>An error occoured while loading the page.</p>\
    <p>Error Code: " + errorCode + "</p>\
    <p>Error description: " + description + "</p>\
    <button onclick='location.replace(\"" + retry_url + "\")'>Retry</button>\
    </body>\
    </html>");
}

module.exports = {createPage}