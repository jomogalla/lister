var utilities = utilities || {};
utilities.api = function (requestObject) {


    return $.ajax({
        url: constants.httpsUrlPrefix + utilities.authenticator.getSubDomain() + constants.apiUrlSuffix,
        type: constants.requestType,
        data: JSON.stringify(requestObject),
        contentType: constants.contentType,
    })
};

