<template>
    <div id="home-tag">
        <RouterLink to="/">🏠</RouterLink>
        <RouterLink to="/">🌎</RouterLink>
    </div>
</template>

<style lang="scss" scoped>
#home-tag {
    position: fixed;
    left: -38px;
    bottom: 30px;
    transition: left 0.1s linear;
    display: flex;
    flex-direction: column;
    gap: 5px;

    background-color: white;
    border: 1px solid black;
    padding: 3px;

    a {
        padding: 3px 10px;
        text-decoration: none;
    }

    &:hover {
        left: -5px;
    }
}
</style>
