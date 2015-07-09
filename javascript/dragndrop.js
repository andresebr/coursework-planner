/* 
 * File: dragndrop.js
 * Author: Andres E. Barreto
 */

//Global Variables
var diffX, diffY;

//******************************************************************************
//The event handler function to allow dropping of elements.
function allowDrop(ev)
{
    //Stop any default
    ev.preventDefault();
}

//******************************************************************************
//The event handler function for grabbing the courses.
function drag(ev)
{
    //Determine the position of the element to be dragged
    var pos = getElementPosition(document.getElementById(ev.target.id));
    var posX = pos.left;
    var posY = pos.top;

    // Compute the difference between where it is and where the mouse click occurred
    diffX = ev.clientX - posX;
    diffY = ev.clientY - posY;
    //Set data to be transfered
    ev.dataTransfer.setData("Text", ev.target.id);
}

//******************************************************************************
//The event handler function for dropping the courses.
function drop(ev)
{
    //Determine the position of workspace to avoid dropped elements misalignment.
    var workspace_pos = getElementPosition(document.getElementById("workspace"));
    var workspaceX = workspace_pos.left;
    var workspaceY = workspace_pos.top;
    var dropped_courses;

    //Stop any default
    ev.preventDefault();
    //Get data transfered when the course is dropped in the drop space
    var data = ev.dataTransfer.getData("Text");
    //Append data to the new div
    ev.target.appendChild(document.getElementById(data));
    //Position the element in the drop space
    document.getElementById(data).style.position = "absolute";
    document.getElementById(data).style.left = (ev.clientX - diffX - workspaceX) + "px";
    document.getElementById(data).style.top = (ev.clientY - diffY - workspaceY) + "px";
    document.getElementById(data).style.backgroundColor = "#002244";
    //Clear previous modifications inside the canvas
    clearCanvas();
    //Get all the courses dropped in drop space
    dropped_courses = getDroppedCourses();
    //Prepare courses to be joined by lines to its corresponding prerequisite
    joinCourses(dropped_courses);
    highlightAvailablePrereqs(document.getElementById(data).getAttribute("id"));
    //Prevent propagation of the event
    ev.stopPropagation();
}

//******************************************************************************
//Function to draw a line that will join every course with its respective prerequisites
function drawLine(course1, course2) {
    //Get the position of the workspace and courses in the drop space to avoid misalignment
    var workspace_pos = getElementPosition(document.getElementById("workspace"));
    var workspaceX = workspace_pos.left;
    var workspaceY = workspace_pos.top;
    var course1_pos = getElementPosition(document.getElementById(course1));
    var course2_pos = getElementPosition(document.getElementById(course2));
    //Get the width of each course container to center connection of thedrawed lines
    var course1_width = document.getElementById(course1).offsetWidth;
    var course2_width = document.getElementById(course2).offsetWidth;
    //Get canvas
    var canvas = document.getElementById("canvas");
    if (canvas.getContext) {
        //Get canvas context
        var ctx = canvas.getContext("2d");
        //Lines styles
        ctx.fillStyle = "red";
        ctx.strokeStyle = "red";
        //Set line starting point
        ctx.moveTo(course1_pos.left - workspaceX + course1_width / 2, course1_pos.top - workspaceY);
        //Draw circular arrow
        ctx.arc(course1_pos.left - workspaceX + course1_width / 2, course1_pos.top - workspaceY, 5, 0, 2 * Math.PI);
        //Set line end point
        ctx.lineTo(course2_pos.left - workspaceX + course2_width / 2, course2_pos.top - workspaceY);
        //Draw line
        ctx.fill();
        ctx.stroke();
    }
}

//******************************************************************************
//Function to prepare the courses to be joined using lines.
function joinCourses(dropped_courses) {
    var prereq_list;
    var course_index;

//Check all the courses dropped in dropspace and verify the prerequisites for each one
    for (var i = 0; i < dropped_courses.length; i++) {
        prereq_list = getPrereq(dropped_courses[i]);
        for (var j = 0; j < prereq_list.length; j++) {
            //Check if the prerequisite has been dropped before
            course_index = arrayContains(dropped_courses, prereq_list[j]);
            if (course_index >= 0) {
                //Connect the courses using a line
                drawLine(dropped_courses[i], dropped_courses[course_index]);
            }
        }
    }
}

//******************************************************************************
//Function to highlight with red backgorund the prerequisites that are not in the drop space
function highlightAvailablePrereqs(course_id) {
    //Get list of prerequisites of the last dropped course
    var prereq_list = getPrereq(course_id);
    //Get a list of courses that are in the course countainer
    var available_list = getAvailableCourses();
    var course_index;
    
    //For all courses in course container
    for (var i = 0; i < prereq_list.length; i++) {
        course_index = arrayContains(available_list, prereq_list[i]);
        //If a prerequisite is in course container
        if (course_index >= 0) {
            //Highlight the course with red
            document.getElementById(prereq_list[i]).style.backgroundColor = "red";
        }
    }
}


//******************************************************************************
//Function to get the prerequistes of a course from xml/courses_info.xml
function getPrereq(course_id) {
    var prereq_str = "";
    var prereq_list;
    //Load XML document
    var xmlDoc = loadXMLDoc("xml/courses_info.xml");
    //Get prerequisite enformation for every course
    var x = xmlDoc.getElementsByTagName("prereq");

    //Look for the course information needed
    for (var i = 0; i < x.length; i++)
    {
        //Get prerequisites of the course
        if (x[i].parentNode.getAttribute("id") == course_id) {
            prereq_str = x[i].childNodes[0].nodeValue;
            //Transform the string into a list
            prereq_list = prereq_str.split(",");
        }

    }
    //Return a list of prerequisits of the course
    return prereq_list;
}

//******************************************************************************
//Function to get the courses that are contained in he drop space
function getDroppedCourses() {

    var dropped_courses = new Array();
    var e = document.getElementById("dropspace").getElementsByTagName("*");

    //Get all the courses inside drop space and store thei ids in a list 
    for (var i = 0; i < e.length; i++) {
        if (e[i].hasAttribute("id")) {
            dropped_courses[i] = e[i].id;
        }
    }
    //Return the list of courses in the drop space
    return dropped_courses;
}

//******************************************************************************
//Function to get the courses that are contained in he course container
function getAvailableCourses() {

    var available_courses = new Array();
    var e = document.getElementById("coursecontainer").getElementsByTagName("*");

    //Get all the courses inside course container and store thei ids in a list 
    for (var i = 0; i < e.length; i++) {
        if (e[i].hasAttribute("id")) {
            available_courses[i] = e[i].id;
        }
    }
    //Return the list of courses in the course container
    return available_courses;
}

//******************************************************************************
//Function to get the coordinates of an element
function getElementPosition(el) {
    var l = 0, t = 0;
    while (el.offsetParent) {
        l += el.offsetLeft;
        t += el.offsetTop;
        el = el.offsetParent;
    }
    return {left: l, top: t};
}

//******************************************************************************
//Function to clear the canvas
function clearCanvas() {
    var canvas = document.getElementById("canvas");

    canvas.width = canvas.width;
}

//******************************************************************************
//Function to get the index of an element inside an array
function arrayContains(list, element) {
    var index = list.indexOf(element);

    return index;
}

//******************************************************************************
//Function to load the XML file
//function loadXMLDoc(filename)
//{
//    if (window.XMLHttpRequest)
//    {
//        xhttp = new XMLHttpRequest();
//    }
//    else // code for IE5 and IE6
//    {
//        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
//    }
//    xhttp.open("GET", filename, false);
//    xhttp.send();
//    return xhttp.responseXML;
//}

function loadXMLDoc(dname) {
    try //Internet Explorer
    {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    } catch (e) {
        try //Firefox, Mozilla, Opera, etc.
        {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", dname, false);
            xmlhttp.setRequestHeader('Content-Type', 'text/xml');
            xmlhttp.send("");
            xmlDoc = xmlhttp.responseXML;
        } catch (e) {
            alert(e.message);
        }
    }
    try {
        return (xmlDoc);
    } catch (e) {
        alert(e.message);
    }
    return (null);
}

//******************************************************************************
//Function to write available courses dinamically in the HTML using information stored on courses_info.xml
function getCourses() {
    var courses_html = '';
    var id;
    var name;
    //Load XML document
    var xmlDoc = loadXMLDoc("xml/courses_info.xml");
    var x = xmlDoc.getElementsByTagName("name");
    var y = xmlDoc.getElementsByTagName("code");

    for (var i = 0; i < x.length; i++) {
        name = y[i].childNodes[0].nodeValue + " " + x[i].childNodes[0].nodeValue;
        id = x[i].parentNode.getAttribute("id");
        courses_html += '<p class="draggable" id="' + id + '" draggable="true" ondragstart="drag(event)">' + name + '</p>';
    }
    document.getElementById("coursecontainer").innerHTML = courses_html;
}