<template>
    <div class="navbar-brand">
        <i :class="['pi', icon, 'brand-icon']"></i>
        <h2 class="brand-title">
            <span class="desktop-title">{{ desktopTitle }}</span>
            <span class="mobile-title">{{ mobileTitle || desktopTitle }}</span>
        </h2>
    </div>
</template>

<script setup lang="ts">
defineProps({
    icon: {
        type: String,
        default: 'pi-compass'
    },
    desktopTitle: {
        type: String,
        required: true
    },
    mobileTitle: {
        type: String,
        default: ''
    }
});
</script>

<style scoped lang="scss">
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  
  .brand-icon {
    font-size: 1.35rem;
    color: #3b82f6;
  }

  .brand-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.mobile-title {
  display: none;
}
.desktop-title {
  display: inline;
}

@media (max-width: 1024px) {
  .desktop-title {
    display: none;
  }
  .mobile-title {
    display: inline;
  }
}

// 日間模式適應樣式 (Day/Light Mode)
:root:not(.p-dark) {
  .navbar-brand .brand-title {
    background: linear-gradient(135deg, #0f172a, #475569);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>
