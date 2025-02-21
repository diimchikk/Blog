/*
//const store = require ("../../Authorization/client/my-app/src/store/store");
function handleAuthRedirect(targetUrl){
    if(Store.isAuth){
        window.location.href = targetUrl;
    }else{
        showModal();
    }
}
function showModal(){
    const modal = document.getElementById("auth-modal");
    modal.classList.remove('hidden');
}
 function closeModal(){
    const modal = document.getElementById("auth-modal");
    modal.classList.add("hidden");
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('write-btn').addEventListener('click', () => {
        //window.location.href = '/add';
        handleAuthRedirect('/add'); 
    });
});
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-btn').addEventListener('click', () => {
        closeModal() 
    });
});*/