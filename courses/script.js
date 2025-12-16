$(document).ready(function () {

  $('#menu').click(function () {
    $(this).toggleClass('fa-times');
    $('.navbar').toggleClass('nav-toggle');
  });

  $(window).on('scroll load', function () {
    $('#menu').removeClass('fa-times');
    $('.navbar').removeClass('nav-toggle');

    if (window.scrollY > 60) {
      document.querySelector('#scroll-top').classList.add('active');
    } else {
      document.querySelector('#scroll-top').classList.remove('active');
    }
  });

  // smooth scrolling
  $('a[href*="#"]').on('click', function (e) {
    e.preventDefault();
    $('html, body').animate({
      scrollTop: $($(this).attr('href')).offset().top,
    }, 500, 'linear')
  });

  loadCourses();
  setupModal();
});

function loadCourses() {
  fetch('/courses/courses.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(courses => {
      displayCourses(courses);
    })
    .catch(error => {
      console.error('Error fetching courses:', error);
      document.querySelector('.courses-container').innerHTML = '<p>Error loading courses. Please try again later.</p>';
    });
}

function displayCourses(courses) {
  const container = document.querySelector('.courses-container');
  let html = '';

  courses.forEach(course => {
    const stars = '★'.repeat(Math.floor(course.rating)) + '☆'.repeat(5 - Math.floor(course.rating));

    html += `
      <div class="course-card" onclick="openCourseDetail(${course.id})">
        <img src="${course.image}" alt="${course.name}" class="course-card-image">
        <div class="course-card-content">
          <h3>${course.name}</h3>
          <p class="course-card-instructor">${course.instructor}</p>
          
          <div class="course-card-rating">
            <span class="course-card-stars">${stars}</span>
            <span class="course-card-reviews">(${course.reviews} reviews)</span>
          </div>

          <p class="course-card-description">${course.shortDesc}</p>

          <div class="course-card-footer">
            <span class="course-card-price">${course.price}</span>
            <span class="course-card-duration">
              <i class="fas fa-clock"></i> ${course.duration}
            </span>
          </div>
        </div>
        <button class="course-card-btn" onclick="event.stopPropagation(); openCourseDetail(${course.id})">View Details</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openCourseDetail(courseId) {
  fetch('/courses/courses.json')
    .then(response => response.json())
    .then(courses => {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        displayCourseDetail(course);
        document.getElementById('courseDetailModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
    })
    .catch(error => console.error('Error loading course details:', error));
}

function displayCourseDetail(course) {
  const stars = '★'.repeat(Math.floor(course.rating)) + '☆'.repeat(5 - Math.floor(course.rating));

  document.getElementById('modalCourseImage').src = course.image;
  document.getElementById('modalCourseName').textContent = course.name;
  document.getElementById('modalInstructor').textContent = course.instructor;
  document.getElementById('modalRating').textContent = stars;
  document.getElementById('modalReviews').textContent = `${course.reviews} reviews`;
  document.getElementById('modalPrice').textContent = course.price;
  document.getElementById('modalDuration').textContent = course.duration;
  document.getElementById('modalDescription').textContent = course.description;

  // Highlights
  let highlightsHtml = '';
  course.highlights.forEach(highlight => {
    highlightsHtml += `<li>${highlight}</li>`;
  });
  document.getElementById('modalHighlights').innerHTML = highlightsHtml;

  // Syllabus
  let syllabusHtml = '';
  course.syllabus.forEach(section => {
    let topicsHtml = '';
    section.topics.forEach(topic => {
      topicsHtml += `<li>${topic}</li>`;
    });
    syllabusHtml += `
      <div class="syllabus-section">
        <div class="syllabus-section-title">${section.section}</div>
        <ul class="syllabus-topics">${topicsHtml}</ul>
      </div>
    `;
  });
  document.getElementById('modalSyllabus').innerHTML = syllabusHtml;

  // Requirements
  let requirementsHtml = '';
  course.requirements.forEach(requirement => {
    requirementsHtml += `<li>${requirement}</li>`;
  });
  document.getElementById('modalRequirements').innerHTML = requirementsHtml;

  // Store course ID for buy button
  document.getElementById('buyNowBtn').dataset.courseId = course.id;
  document.getElementById('buyNowBtn').dataset.courseName = course.name;
  document.getElementById('buyNowBtn').dataset.coursePrice = course.price;
}

function setupModal() {
  const modal = document.getElementById('courseDetailModal');
  const closeBtn = document.querySelector('.modal-close');

  closeBtn.onclick = function () {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  };

  // Buy Now Button
  document.getElementById('buyNowBtn').onclick = function () {
    const courseName = this.dataset.courseName;
    const coursePrice = this.dataset.coursePrice;
    handleBuyNow(courseName, coursePrice);
  };

  // Preview Button
  document.querySelector('.btn-preview').onclick = function () {
    alert('Preview feature coming soon!');
  };
}

function handleBuyNow(courseName, coursePrice) {
  // Show confirmation message
  alert(`Thank you for your interest in "${courseName}"!\n\nPrice: ${coursePrice}\n\nPayment gateway integration coming soon. For now, you can contact us at shivam19e@gmail.com to enroll.`);

  // Optional: Close the modal after purchase intent
  document.getElementById('courseDetailModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Disable developer mode
document.onkeydown = function (e) {
  if (e.keyCode == 123) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
    return false;
  }
}
