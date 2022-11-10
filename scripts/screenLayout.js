
//Add either portrait or landscape to body

function updateLayout() {
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    if (windowHeight < windowWidth) { //Landscape
        $("body").removeClass("portrait").addClass("landscape");
    } else { //Portrait
        $("body").removeClass("landscape").addClass("portrait");
    }
}

$(window).resize(updateLayout);
$(document).ready(updateLayout);