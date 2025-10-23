   // Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobile-menu');
    const mobileNav = document.getElementById('mobile-nav');
    const body = document.body;
    
    mobileMenuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        mobileNav.classList.toggle('active');
        body.classList.toggle('menu-open'); // this makes CSS work
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#mobile-menu') && !e.target.closest('#mobile-nav')) {
            mobileNav.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
});

       // hero section animation
    
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector('.hero');
  const heroText = document.querySelector('.hero-text');
  const mobileImage = document.querySelector('.mobile-image');

  // Helper to add classes safely
  function animateIn() {
    if (heroText && !heroText.classList.contains('animate-in')) {
      heroText.classList.add('animate-in');
    }
    if (mobileImage && !mobileImage.classList.contains('animate-in')) {
      mobileImage.classList.add('animate-in');
    }
  }

  // 1) Trigger on load after a short delay (gives nice stagger)
  setTimeout(animateIn, 300);

  // 2) Also observe hero entering viewport (useful if loaded below fold)
  if ('IntersectionObserver' in window && hero) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateIn();
          obs.disconnect();
        }
      });
    }, { threshold: 0.25 });
    io.observe(hero);
  }
});



        // FAQ accordion functionality - IMPROVED
        const faqItems = document.querySelectorAll('.faq-item');

        // Open first FAQ by default
        if (faqItems.length > 0) {
            faqItems[0].classList.add('active');
        }

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');

            question.addEventListener('click', () => {
                // Close other open items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
            });
        });

        // Auto-scroll market ticker on hover - FIXED
        const ticker = document.querySelector('.ticker-content');

        ticker.addEventListener('mouseenter', function () {
            this.style.animationPlayState = 'paused';
        });

        ticker.addEventListener('mouseleave', function () {
            this.style.animationPlayState = 'running';
        });

        // Fix for ticker animation - reset position when animation completes
        ticker.addEventListener('animationiteration', () => {
            // Reset to initial position when animation completes a cycle
            if (ticker.style.animationPlayState !== 'paused') {
                ticker.style.transition = 'none';
                ticker.style.transform = 'translateX(0)';

                // Force reflow
                void ticker.offsetWidth;

                ticker.style.transition = '';
            }
        });

           // Auto-scroll market pairs
     const pairContainer = document.querySelector('.pairs-container');
        
        // Pause animation on hover
        pairContainer.addEventListener('mouseenter', () => {
            pairContainer.style.animationPlayState = 'paused';
        });
        
        pairContainer.addEventListener('mouseleave', () => {
            pairContainer.style.animationPlayState = 'running';
        });

        

        // Animate elements on scroll
        const animateOnScroll = function () {
            const elements = document.querySelectorAll('.feature-card, .pair-card, .testimonial-card, .scrollss, .about-words, .about-image, .stat-item, .words-gen, .phone-mockup, .halfphone-holder, .full-width-container, .slantphoto-words');

            elements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.3;

                if (elementPosition < screenPosition) {
                    element.style.opacity = 1;
                    element.style.transform = 'translateY(0)';
                }
            });
        };

        // Initialize elements for animation
        window.addEventListener('DOMContentLoaded', function () {
            const elements = document.querySelectorAll('.feature-card, .pair-card, .testimonial-card, .stat-item');

            elements.forEach(element => {
                element.style.opacity = 0;
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            });

            window.addEventListener('scroll', animateOnScroll);
            // Trigger once on load in case elements are already in view
            animateOnScroll();
        });






              document.addEventListener('DOMContentLoaded', function() {
            const sideImages = document.querySelectorAll('.flanking-image');
            const phoneImage = document.querySelector('.main-phone-image');
            
            // Create Intersection Observer to detect when section is in view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Add active class to side images with a delay
                        setTimeout(() => {
                            sideImages.forEach(image => {
                                image.classList.add('in-view');
                            });
                        }, 300);
                        
                        // Scale up the phone image slightly
                        phoneImage.style.transform = 'scale(1)';
                    } else {
                        // Remove active class when section is out of view
                        sideImages.forEach(image => {
                            image.classList.remove('in-view');
                        });
                        
                        // Reset phone image scale
                        phoneImage.style.transform = 'scale(0.8)';
                    }
                });
            }, {
                threshold: 0.5
            });
            
            // Observe the phone gallery section
            const phoneDisplaySection = document.querySelector('.scroll-phone-display');
            observer.observe(phoneDisplaySection);
            
            // Add scroll effect for more interactive feel
            window.addEventListener('scroll', () => {
                const scrollPosition = window.scrollY;
                const galleryOffset = phoneDisplaySection.offsetTop;
                const galleryHeight = phoneDisplaySection.offsetHeight;
                
                // Calculate how far we've scrolled through the gallery section (0 to 1)
                const scrollPercent = (scrollPosition - galleryOffset + window.innerHeight / 1) / galleryHeight;
                
                // Only apply effects when we're in the gallery section
                if (scrollPercent > 0 && scrollPercent < 1) {
                    // Adjust opacity based on scroll position
                    sideImages.forEach(image => {
                        image.style.opacity = Math.min(1, scrollPercent * 2);
                    });
                }
            });
        });

        document.addEventListener("DOMContentLoaded", function () {
  const counters = document.querySelectorAll(".counter-number");
  let counterStarted = false;

  function animateCounter(counter) {
    const target = +counter.getAttribute("data-target"); // number to reach
    let current = 0;
    const increment = target / 200; // speed (bigger divisor = slower)

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target; // final value
      }
    };
    updateCounter();
  }

  // Intersection Observer to trigger counters when in view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !counterStarted) {
          counters.forEach((counter) => animateCounter(counter));
          counterStarted = true; // ensures it runs only once
        }
      });
    },
    { threshold: 0.5 }
  );

  const counterSection = document.querySelector(".counters-section");
  if (counterSection) observer.observe(counterSection);
});
