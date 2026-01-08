
//============================ STAR BACKGROUND  ============================
const starsDiv = document.getElementById('stars');
    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.width = star.style.height = Math.random() * 2 + 'px';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 4 + 's';
      starsDiv.appendChild(star);
    }
//============================ PLATFORM AND GROUND COLORS ============================
const platformSelect = document.getElementById('platformColor');
const groundSelect = document.getElementById('groundColor');
const platformSwatch = document.getElementById('platformSwatch');
const groundSwatch = document.getElementById('groundSwatch');

    function updateSwatch(select, swatch) {
      swatch.style.background = select.value;
    }

    platformSelect.addEventListener('change', () => updateSwatch(platformSelect, platformSwatch));
    groundSelect.addEventListener('change', () => updateSwatch(groundSelect, groundSwatch));


//============================ TABS ============================
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(targetTab + 'Tab').classList.add('active');
  });
});


/* ===============================
 MODAL STUFF
================================= */
document.addEventListener('DOMContentLoaded', () => {
  const helpBtn = document.getElementById('helpBtn');
  const dropdown = helpBtn?.parentElement;
  const dropdownMenu = document.getElementById('dropdownMenu');
  const modal = document.getElementById('helpModal');
  const guideModal = document.getElementById('guideModal');
  const closeModal = document.getElementById('closeModal');
  const closeGuide = document.getElementById('closeGuide');
  const closeGuideBottom = document.getElementById('closeGuideBottom');
  const openGuideBtn = document.getElementById('openGuideBtn');
  const floatingBackToTop = document.getElementById('floatingBackToTop');

  // ================================== BACK TO TOP ==================================
  const showBackToTop = () => {
    if (floatingBackToTop) {
      floatingBackToTop.classList.add('visible');
    }
  };

  const hideBackToTop = () => {
    if (floatingBackToTop) {
      floatingBackToTop.classList.remove('visible');
    }
  };

  if (floatingBackToTop) {
    const modalContent = modal?.querySelector('.modal-content');
    const guideContent = guideModal?.querySelector('.modal-content');
    
    floatingBackToTop.onclick = () => {
      if (modal && modal.style.display === 'flex' && modalContent) {
        modalContent.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      if (guideModal && guideModal.style.display === 'flex' && guideContent) {
        guideContent.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    if (modalContent) {
      modalContent.addEventListener('scroll', () => {
        if (modalContent.scrollTop > 150) {
          showBackToTop();
        } else {
          hideBackToTop();
        }
      });
    }

    if (guideContent) {
      guideContent.addEventListener('scroll', () => {
        if (guideContent.scrollTop > 150) {
          showBackToTop();
        } else {
          hideBackToTop();
        }
      });
    }
  }

  // ================================== DROP DOWN ==================================
  if (helpBtn && dropdown) {
    helpBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    };

    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });

    if (dropdownMenu) {
      dropdownMenu.onclick = (e) => e.stopPropagation();
    }
  }

  // ================================== MAIN MODAL ==================================
  const openMainHelp = document.getElementById('openMainHelp');
  if (openMainHelp && modal) {
    openMainHelp.onclick = () => {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (dropdown) dropdown.classList.remove('active');
    };
  }

  if (closeModal && modal) {
    closeModal.onclick = () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      hideBackToTop();
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        hideBackToTop();
      }
    };
  }

  // ================================== GUIDE MODAL ==================================
  const openGuide = document.getElementById('openGuide');
  if (openGuide && guideModal) {
    openGuide.onclick = () => {
      guideModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (dropdown) dropdown.classList.remove('active');
    };
  }

  if (openGuideBtn && modal && guideModal) {
    openGuideBtn.onclick = () => {
      modal.style.display = 'none';
      guideModal.style.display = 'flex';
    };
  }

  const closeGuideFn = () => {
    if (guideModal) {
      guideModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      hideBackToTop();
    }
  };

  if (closeGuide) closeGuide.onclick = closeGuideFn;
  if (closeGuideBottom) closeGuideBottom.onclick = closeGuideFn;

  if (guideModal) {
    guideModal.onclick = (e) => {
      if (e.target === guideModal) closeGuideFn();
    };
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal) modal.style.display = 'none';
      if (guideModal) guideModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      hideBackToTop();
    }
  });


// ==================== LEFT DROPDOWN MENU ====================
    const menuTrigger = document.querySelector('.menu-trigger');
    const leftDropdown = document.querySelector('.left-dropdown');

    if (menuTrigger && leftDropdown) {
        menuTrigger.onclick = (e) => {
            e.stopPropagation();
            leftDropdown.classList.toggle('active');
        };

        document.addEventListener('click', () => {
            leftDropdown.classList.remove('active');
        });

        document.querySelector('.left-menu')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

});





//============================ GRID CONTROLS ============================
//============================ GRID CONTROLS ============================
const gridToggle = document.getElementById('gridToggle');
const gridSizeSlider = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const toggleGridPanel = document.getElementById('toggleGridPanel');
const gridControlsContent = document.querySelector('.grid-controls-content');



window.gridSettings = {
  enabled: true,
  size: 50
};

if (gridToggle) {
  gridToggle.addEventListener('change', () => {
    window.gridSettings.enabled = gridToggle.checked;
  });
}

if (gridSizeSlider && gridSizeValue) {
  gridSizeSlider.addEventListener('input', () => {
    window.gridSettings.size = parseInt(gridSizeSlider.value);
    gridSizeValue.textContent = gridSizeSlider.value;
  });
}

if (toggleGridPanel && gridControlsContent) {
  toggleGridPanel.addEventListener('click', () => {
    gridControlsContent.classList.toggle('hidden');
    toggleGridPanel.classList.toggle('collapsed');
  });
}

//============================ MOUSE COORDINATES ============================
const coordsToggle = document.getElementById('coordsToggle');

window.coordsSettings = {
  enabled: false
};

if (coordsToggle) {
  coordsToggle.addEventListener('change', () => {
    window.coordsSettings.enabled = coordsToggle.checked;
  });
}

//============================ JUMP ARCS ============================
window.arcSettings = {
  showStanding: true,
  showMoving: true,
  showRecorded: true
};

document.getElementById("arcStandingToggle").addEventListener("change", e => {
  window.arcSettings.showStanding = e.target.checked;
});

document.getElementById("arcMovingToggle").addEventListener("change", e => {
  window.arcSettings.showMoving = e.target.checked;
});

document.getElementById("arcRecordedToggle").addEventListener("change", e => {
  window.arcSettings.showRecorded = e.target.checked;
});
