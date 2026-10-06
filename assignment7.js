const cardHand=document.getElementById("cardHand");
const discardPile=document.getElementById("discardPile");
const dealButton=document.getElementById("dealButton");
const resetButton=document.getElementById("resetButton");
const statusBox=document.getElementById("dragDropStatus");

const suits=[
{code:"S",name:"Spades"},{code:"H",name:"Hearts"},
{code:"D",name:"Diamonds"},{code:"C",name:"Clubs"}
];
const ranks=[
{value:1,name:"Ace"},{value:2,name:"2"},{value:3,name:"3"},
{value:4,name:"4"},{value:5,name:"5"},{value:6,name:"6"},
{value:7,name:"7"},{value:8,name:"8"},{value:9,name:"9"},
{value:10,name:"10"},{value:11,name:"Jack"},{value:12,name:"Queen"},
{value:13,name:"King"}
];

let deck=[];
let hand=[];

function createDeck(){
    const newDeck=[];
    suits.forEach(function(suit){
        ranks.forEach(function(rank){
            newDeck.push({
                id:suit.code+rank.value,
                suitName:suit.name,
                rankName:rank.name,
                image:"cards/"+suit.code+rank.value+".svg"
            });
        });
    });
    return newDeck;
}

function shuffle(cards){
    for(let i=cards.length-1;i>0;i--){
        const randomIndex=Math.floor(Math.random()*(i+1));
        [cards[i],cards[randomIndex]]=[cards[randomIndex],cards[i]];
    }
}

function dealHand(){
    deck=createDeck();
    shuffle(deck);
    hand=[];
    cardHand.innerHTML="";
    resetDiscardPile();

    for(let i=0;i<5;i++){
        addCardToHand();
    }

    statusBox.textContent="Five cards dealt. Drag a card to the discard pile.";
}

function addCardToHand(){
    if(deck.length===0){
        statusBox.textContent="There are no cards left in the deck.";
        return;
    }

    const card=deck.pop();
    hand.push(card);

    const image=document.createElement("img");
    image.src=card.image;
    image.alt=card.rankName+" of "+card.suitName;
    image.className="playing-card";
    image.draggable=true;
    image.dataset.cardId=card.id;

    image.addEventListener("dragstart",function(event){
        event.dataTransfer.setData("text/plain",card.id);
        event.dataTransfer.effectAllowed="move";
        image.classList.add("dragging");
    });

    image.addEventListener("dragend",function(){
        image.classList.remove("dragging");
    });

    cardHand.appendChild(image);
}

function discardCard(cardId){
    const cardIndex=hand.findIndex(function(card){
        return card.id===cardId;
    });

    if(cardIndex===-1) return;

    const discardedCard=hand.splice(cardIndex,1)[0];
    const cardImage=cardHand.querySelector('[data-card-id="'+cardId+'"]');

    if(cardImage) cardImage.remove();

    const discardedImage=document.createElement("img");
    discardedImage.src=discardedCard.image;
    discardedImage.alt="Discarded "+discardedCard.rankName+" of "+discardedCard.suitName;
    discardedImage.className="discarded-card";

    discardPile.innerHTML="";
    discardPile.appendChild(discardedImage);

    statusBox.textContent="Drop event captured: "+discardedCard.rankName+
        " of "+discardedCard.suitName+
        " was discarded. A replacement card was dealt.";

    addCardToHand();
}

function resetDiscardPile(){
    discardPile.innerHTML='<h3 id="discard-heading">Discard Pile</h3>'+
        '<div class="discard-placeholder">'+
        '<strong>DROP CARD HERE</strong>'+
        '<span>Drag a card from your hand to this area.</span></div>';
}

dealButton.addEventListener("click",dealHand);

resetButton.addEventListener("click",function(){
    deck=[];
    hand=[];
    cardHand.innerHTML="";
    resetDiscardPile();
    statusBox.textContent='Click "Deal 5 Cards" to start.';
});

discardPile.addEventListener("dragover",function(event){
    event.preventDefault();
    event.dataTransfer.dropEffect="move";
    discardPile.classList.add("drag-over");
});

discardPile.addEventListener("dragleave",function(event){
    if(!discardPile.contains(event.relatedTarget)){
        discardPile.classList.remove("drag-over");
    }
});

discardPile.addEventListener("drop",function(event){
    event.preventDefault();
    discardPile.classList.remove("drag-over");
    discardCard(event.dataTransfer.getData("text/plain"));
});
