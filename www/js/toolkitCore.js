/**
 * For overwriting core functions of the ui-toolkit.
 */

 /**
  * change max toolbar-item-count from 2 to 3:
  */
var newSetupPageAction = function(oldFooter, parent) {
    this._oldFooter = oldFooter;
    this._oldFooterParent = parent;
    this._overlay = document.querySelector('[data-role="overlay"]');

    this.__createPageActions();
    
    var newActionsBar = document.querySelector('[data-role="actions"]');
    if (! newActionsBar)
        return;

    if (!this._oldFooter)
        return;

    var actionBar = this._oldFooter,
        actions = actionBar.querySelector('ul'),
        actionButtons = actionBar.querySelectorAll('ul li'),
        i = actionButtons.length;

    newActionsBarWrapper = document.createElement('div');
    newActionsBarWrapper.setAttribute("data-role", "actions-wrapper");
    newActionsBarWrapper.setAttribute("id", "actions_" + this._oldFooterParent.id);

    if (actionButtons.length > 4) {
        // Maintain the first then replace the rest with an action overflow
        var firstAction = actionButtons[0],
            overflowList = document.createElement('ul'),
            /* Actions Button */
            firstButton = document.createElement('button'),
            overflowButton = document.createElement('button'),
            /* Icon */
            firstIcon = firstAction.querySelector('img').getAttribute('src'),
            /* ID*/
            firstId = firstAction.querySelector('a').getAttribute('id'),
            k = 2;

        this._tabTitle.style.width = "calc(100% - 155px)";

        // Maintain the second item
        var secondAction = actionButtons[1],
            /* Action Button */
            secondButton = document.createElement('button'),
            /* Icon */
            secondIcon = secondAction.querySelector('img').getAttribute('src'),
            /* ID*/
            secondId = secondAction.querySelector('a').getAttribute('id');

        overflowList.setAttribute('data-role', 'actions-overflow-list');

        // Hide the overflow
        for (var x = k; x < i; x++) {
            var li = document.createElement('li'),
                a_id = actionButtons[x].querySelector('a').getAttribute('id'),
                lbl = actionButtons[x].querySelector('span').innerHTML,
                icon = actionButtons[x].querySelector('img').getAttribute('src');

            li.innerHTML = lbl;
            li.setAttribute('id', a_id);

            li.style.backgroundImage = 'url( ' + icon + ' )';
            overflowList.appendChild(li);

            li.onclick = function(e) {
                overflowList.classList.toggle('opened');
                self._overlay.classList.toggle('active');
                e.preventDefault();
            };
        }

        // Add the action overflow button
        overflowButton.setAttribute('data-role', 'actions-overflow-icon');

        firstButton.setAttribute('id', firstId);
        document.styleSheets[0].addRule('#' + firstId + ':after', 'background-image: url("' + firstIcon + '");');
        newActionsBarWrapper.appendChild(firstButton);

        secondButton.setAttribute('id', secondId);
        document.styleSheets[0].addRule('#' + secondId + ':after', 'background-image: url("' + secondIcon + '");');
        newActionsBarWrapper.appendChild(secondButton);

        newActionsBarWrapper.appendChild(overflowButton);
        newActionsBarWrapper.appendChild(overflowList);

        self = this;
        overflowButton.onclick = function(e) {
            overflowList.classList.toggle('opened');
            self._overlay.classList.toggle('active');
            e.preventDefault();
        };
    } else {

        for (var y = 0; y < i; y++) {
            var actionButton = document.createElement('button'),
                actionButton_lbl = actionButtons[y].querySelector('span').innerHTML,
                actionButton_icon = actionButtons[y].querySelector('img').getAttribute('src'),
                actionButton_id = actionButtons[y].querySelector('a').getAttribute('id');

            actionButton.setAttribute('id', actionButton_id);
            
            //document.styleSheets[1].insertRule('#' + actionButton_id + ':after', 'background-image: url("' + actionButton_icon + '");', 1);
            var styleEl = document.createElement('style');
            document.head.appendChild(styleEl);
            var styleSheet = styleEl.sheet;
            styleSheet.insertRule('#' + actionButton_id + ':after {background-image: url("' + actionButton_icon + '")');
            
            newActionsBarWrapper.appendChild(actionButton);
        }
    }

    newActionsBar.appendChild(newActionsBarWrapper);
}