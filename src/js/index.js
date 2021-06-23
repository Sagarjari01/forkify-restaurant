import Search from './models/Search';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import { elements, renderLoader, stopLoader } from './views/base';

/**Gloable state object
 * -search object
 * -current recipe object
 * -shopping list object
 * -liked recipes
 */
const state = {};

/**SEARCH CONTROLLER */
const controlSearch = async() => {
    //1 get query from view
    const query = searchView.getInput();
    // console.log(query);
    if (query) {
        //2. new search obj and add to state
        state.search = new Search(query);

        //3. prepare UI for results
        searchView.clearList();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            //4. search for recipes
            await state.search.getResults();

            //5. render result on UI
            stopLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert('Something wrong with Search..');
            stopLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**RECIPE CONTROLLER */

const controlRecipe = async() => {
    const ID = window.location.hash.replace('#', '');

    if (ID) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // highlighted text
        if (state.search) searchView.highlightSelected(ID);

        // create new recipe object
        state.recipe = new Recipe(ID);

        try {
            // get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // calc servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // render recipe
            stopLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(ID));
        } catch (err) {
            alert('Error processing recipe');
            console.log(err);
        }
    }
}

/**LIST CONTROLLER */

const controlList = () => {
    if(!state.list) state.list = new List();

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update list items event
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        // delete from state
        state.list.deleteItem(id);
        // delete from UI
        listView.deleteItem(id);
    }
    // handle the count update
    else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        if(val>0){
            state.list.updateCount(id, val);
        }
    }
});

/**LIKE CONTROLLER */

const controlLike = () =>{
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    if(!state.likes.isLiked(currentID)){
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        likesView.toggleLikeBtn(true);
        likesView.renderLike(newLike);
        
    } else {
        state.likes.deleteLike(currentID);
        likesView.toggleLikeBtn(false);
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener('load', () => {
    state.likes = new Likes();
    // Restore like buttons
    state.likes.readStorage();

    // toggle like button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//handling click buttons
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // decrease btn is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase btn is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
    } else if(e.target.matches('.recipe__love, .recipe__love *')){
        controlLike();
    }
});

