import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import $ from 'jquery';
import { toastr } from 'react-redux-toastr';
import { bindActionCreators } from 'redux';
import classNames from 'classnames';

import PlayerStats from './PlayerStats';
import PlayerRow from './PlayerRow';
import ActivePlayerPrompt from './ActivePlayerPrompt';
import Card from './Card';
import CardZoom from './CardZoom';
import PlayerBoard from './PlayerBoard';
import GameChat from './GameChat';
import PlayerPlots from './PlayerPlots';
import RookerySetup from './RookerySetup';
import GameConfigurationModal from './GameConfigurationModal';
import Droppable from './Droppable';
import * as actions from '../../actions';

const placeholderPlayer = {
    activePlot: null,
    agenda: null,
    cardPiles: {
        bannerCards: [],
        cardsInPlay: [],
        conclavePile: [],
        deadPile: [],
        discardPile: [],
        hand: [],
        outOfGamePile: [],
        plotDeck: [],
        plotDiscard: [],
        shadows: []
    },
    faction: null,
    firstPlayer: false,
    numDrawCards: 0,
    plotSelected: false,
    stats: null,
    title: null,
    user: null
};

export class GameBoard extends React.Component {
    constructor() {
        super();

        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onCardClick = this.onCardClick.bind(this);
        this.handleDrawPopupChange = this.handleDrawPopupChange.bind(this);
        this.onDragDrop = this.onDragDrop.bind(this);
        this.onCommand = this.onCommand.bind(this);
        this.onConcedeClick = this.onConcedeClick.bind(this);
        this.onLeaveClick = this.onLeaveClick.bind(this);
        this.onShuffleClick = this.onShuffleClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.onSettingsClick = this.onSettingsClick.bind(this);
        this.onMessagesClick = this.onMessagesClick.bind(this);

        this.state = {
            cardToZoom: undefined,
            spectating: true,
            showActionWindowsMenu: false,
            showCardMenu: {},
            showMessages: true,
            lastMessageCount: 0,
            newMessages: 0
        };
    }

    componentDidMount() {
        this.updateContextMenu(this.props);
        $('.modal-backdrop').remove();
    }

    componentWillReceiveProps(props) {
        this.updateContextMenu(props);

        let lastMessageCount = this.state.lastMessageCount;
        let currentMessageCount = props.currentGame ? props.currentGame.messages.length : 0;

        if(this.state.showMessages) {
            this.setState({ lastMessageCount: currentMessageCount, newMessages: 0 });
        } else {
            this.setState({ newMessages: currentMessageCount - lastMessageCount });
        }
    }

    updateContextMenu(props) {
        if(!props.currentGame || !props.user) {
            return;
        }

        let thisPlayer = props.currentGame.players[props.user.username];

        if(thisPlayer) {
            this.setState({ spectating: false });
        } else {
            this.setState({ spectating: true });
        }

        let menuOptions = [
            { text: 'Leave Game', onClick: this.onLeaveClick }
        ];

        if(props.currentGame && props.currentGame.started) {
            if(props.currentGame.players[props.user.username]) {
                menuOptions.unshift({ text: 'Concede', onClick: this.onConcedeClick });
            }

            let spectators = props.currentGame.spectators.map(spectator => {
                return <li key={ spectator.id }>{ spectator.name }</li>;
            });

            let spectatorPopup = (
                <ul className='spectators-popup absolute-panel'>
                    { spectators }
                </ul>
            );

            menuOptions.unshift({ text: 'Spectators: ' + props.currentGame.spectators.length, popup: spectatorPopup });

            this.setContextMenu(menuOptions);
        } else {
            this.setContextMenu([]);
        }
    }

    setContextMenu(menu) {
        if(this.props.setContextMenu) {
            this.props.setContextMenu(menu);
        }
    }

    onConcedeClick() {
        this.props.sendGameMessage('concede');
    }

    isGameActive() {
        if(!this.props.currentGame || !this.props.user) {
            return false;
        }

        if(this.props.currentGame.winner) {
            return false;
        }

        let thisPlayer = this.props.currentGame.players[this.props.user.username];
        if(!thisPlayer) {
            thisPlayer = Object.values(this.props.currentGame.players)[0];
        }

        let otherPlayer = Object.values(this.props.currentGame.players).find(player => {
            return player.name !== thisPlayer.name;
        });

        if(!otherPlayer) {
            return false;
        }

        if(otherPlayer.disconnected || otherPlayer.left) {
            return false;
        }

        return true;
    }

    onLeaveClick() {
        if(!this.state.spectating && this.isGameActive()) {
            toastr.confirm('Your game is not finished, are you sure you want to leave?', {
                onOk: () => {
                    this.props.sendGameMessage('leavegame');
                    this.props.closeGameSocket();
                }
            });

            return;
        }

        this.props.sendGameMessage('leavegame');
        this.props.closeGameSocket();
    }

    onMouseOver(card) {
        this.props.zoomCard(card);
    }

    onMouseOut() {
        this.props.clearZoom();
    }

    onCardClick(card) {
        this.props.stopAbilityTimer();
        this.props.sendGameMessage('cardClicked', card.uuid);
    }

    handleDrawPopupChange(event) {
        this.props.sendGameMessage('showDrawDeck', event.visible);
    }

    sendChatMessage(message) {
        this.props.sendGameMessage('chat', message);
    }

    onShuffleClick() {
        this.props.sendGameMessage('shuffleDeck');
    }

    onDragDrop(card, source, target) {
        this.props.sendGameMessage('drop', card.uuid, source, target);
    }

    getPlots(thisPlayer, otherPlayer) {
        let commonProps = {
            cardSize: this.props.user.settings.cardSize,
            onCardClick: this.onCardClick,
            onCardMouseOut: this.onMouseOut,
            onCardMouseOver: this.onMouseOver,
            onDragDrop: this.onDragDrop,
            onMenuItemClick: this.onMenuItemClick
        };
        return (<div key='plots-pane' className='plots-pane'>
            <PlayerPlots
                { ...commonProps }
                activePlot={ otherPlayer.activePlot }
                agenda={ otherPlayer.agenda }
                direction='reverse'
                isMe={ false }
                plotDeck={ otherPlayer.cardPiles.plotDeck }
                plotDiscard={ otherPlayer.cardPiles.plotDiscard }
                plotSelected={ otherPlayer.plotSelected } />
            <PlayerPlots
                { ...commonProps }
                activePlot={ thisPlayer.activePlot }
                agenda={ thisPlayer.agenda }
                direction='default'
                isMe
                plotDeck={ thisPlayer.cardPiles.plotDeck }
                plotDiscard={ thisPlayer.cardPiles.plotDiscard }
                plotSelected={ thisPlayer.plotSelected } />
        </div>);
    }

    onCommand(button) {
        this.props.sendGameMessage(button.command, button.arg, button.method, button.promptId);
    }

    onMenuItemClick(card, menuItem) {
        this.props.stopAbilityTimer();
        this.props.sendGameMessage('menuItemClick', card.uuid, menuItem);
    }

    onPromptDupesToggle(value) {
        this.props.sendGameMessage('toggleDupes', value);
    }

    onPromptedActionWindowToggle(option, value) {
        this.props.sendGameMessage('togglePromptedActionWindow', option, value);
    }

    onTimerSettingToggle(option, value) {
        this.props.sendGameMessage('toggleTimerSetting', option, value);
    }

    onKeywordSettingToggle(option, value) {
        this.props.sendGameMessage('toggleKeywordSetting', option, value);
    }

    onSettingsClick() {
        $('#settings-modal').modal('show');
    }

    onMessagesClick() {
        const showState = !this.state.showMessages;

        let newState = {
            showMessages: showState
        };

        if(showState) {
            newState.newMessages = 0;
            newState.lastMessageCount = this.props.currentGame.messages.length;
        }

        this.setState(newState);
    }

    defaultPlayerInfo(source) {
        let player = Object.assign({}, placeholderPlayer, source);
        player.cardPiles = Object.assign({}, placeholderPlayer.cardPiles, player.cardPiles);
        return player;
    }

    renderBoard(thisPlayer, otherPlayer) {
        if(this.props.rookeryDeck) {
            return (
                <RookerySetup
                    cards={ this.props.cards }
                    cardSize={ this.props.user.settings.cardSize }
                    deck={ this.props.rookeryDeck }
                    onCardMouseOut={ this.onMouseOut }
                    onCardMouseOver={ this.onMouseOver }
                    onSubmit={ this.props.submitRookeryPrompt }
                    packs={ this.props.packs }
                    players={ Object.values(this.props.currentGame.players) }
                    promptId={ this.props.rookeryPromptId }
                    restrictedList={ this.props.restrictedList } />);
        }

        return [
            this.getPlots(thisPlayer, otherPlayer),
            <div key='board-middle' className='board-middle'>
                <div className='player-home-row'>
                    <PlayerRow
                        agenda={ otherPlayer.agenda }
                        bannerCards={ otherPlayer.cardPiles.bannerCards }
                        conclavePile={ otherPlayer.cardPiles.conclavePile }
                        faction={ otherPlayer.faction }
                        hand={ otherPlayer.cardPiles.hand } isMe={ false }
                        isMelee={ this.props.currentGame.isMelee }
                        numDrawCards={ otherPlayer.numDrawCards }
                        discardPile={ otherPlayer.cardPiles.discardPile }
                        deadPile={ otherPlayer.cardPiles.deadPile }
                        drawDeck={ otherPlayer.cardPiles.drawDeck }
                        onCardClick={ this.onCardClick }
                        onMouseOver={ this.onMouseOver }
                        onMouseOut={ this.onMouseOut }
                        outOfGamePile={ otherPlayer.cardPiles.outOfGamePile }
                        username={ this.props.user.username }
                        shadows={ otherPlayer.cardPiles.shadows }
                        spectating={ this.state.spectating }
                        title={ otherPlayer.title }
                        side='top'
                        cardSize={ this.props.user.settings.cardSize } />
                </div>
                <div className='board-inner'>
                    <div className='prompt-area'>
                        <div className='inset-pane'>
                            <ActivePlayerPrompt
                                cards={ this.props.cards }
                                buttons={ thisPlayer.buttons }
                                controls={ thisPlayer.controls }
                                promptText={ thisPlayer.menuTitle }
                                promptTitle={ thisPlayer.promptTitle }
                                onButtonClick={ this.onCommand }
                                onMouseOver={ this.onMouseOver }
                                onMouseOut={ this.onMouseOut }
                                user={ this.props.user }
                                phase={ thisPlayer.phase }
                                timerLimit={ this.props.timerLimit }
                                timerStartTime={ this.props.timerStartTime }
                                stopAbilityTimer={ this.props.stopAbilityTimer } />
                        </div>
                    </div>
                    <div className='play-area'>
                        <PlayerBoard
                            cardsInPlay={ otherPlayer.cardPiles.cardsInPlay }
                            onCardClick={ this.onCardClick }
                            onMenuItemClick={ this.onMenuItemClick }
                            onMouseOut={ this.onMouseOut }
                            onMouseOver={ this.onMouseOver }
                            rowDirection='reverse'
                            user={ this.props.user } />
                        <Droppable onDragDrop={ this.onDragDrop } source='play area'>
                            <PlayerBoard
                                cardsInPlay={ thisPlayer.cardPiles.cardsInPlay }
                                onCardClick={ this.onCardClick }
                                onMenuItemClick={ this.onMenuItemClick }
                                onMouseOut={ this.onMouseOut }
                                onMouseOver={ this.onMouseOver }
                                rowDirection='default'
                                user={ this.props.user } />
                        </Droppable>
                    </div>
                </div>
                <div className='player-home-row our-side'>
                    <PlayerRow isMe={ !this.state.spectating }
                        agenda={ thisPlayer.agenda }
                        bannerCards={ thisPlayer.cardPiles.bannerCards }
                        conclavePile={ thisPlayer.cardPiles.conclavePile }
                        faction={ thisPlayer.faction }
                        hand={ thisPlayer.cardPiles.hand }
                        isMelee={ this.props.currentGame.isMelee }
                        onCardClick={ this.onCardClick }
                        onMouseOver={ this.onMouseOver }
                        onMouseOut={ this.onMouseOut }
                        numDrawCards={ thisPlayer.numDrawCards }
                        onDrawPopupChange={ this.handleDrawPopupChange }
                        onShuffleClick={ this.onShuffleClick }
                        outOfGamePile={ thisPlayer.cardPiles.outOfGamePile }
                        drawDeck={ thisPlayer.cardPiles.drawDeck }
                        onDragDrop={ this.onDragDrop }
                        discardPile={ thisPlayer.cardPiles.discardPile }
                        deadPile={ thisPlayer.cardPiles.deadPile }
                        shadows={ thisPlayer.cardPiles.shadows }
                        showDeck={ thisPlayer.showDeck }
                        spectating={ this.state.spectating }
                        title={ thisPlayer.title }
                        onMenuItemClick={ this.onMenuItemClick }
                        cardSize={ this.props.user.settings.cardSize }
                        side='bottom' />
                </div>
            </div>
        ];
    }

    renderP({ className }) {
        return (
            <div className={`new-player-board ${className}`}>
                <div className='new-card-row'>
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '14001',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            menu: [],
                            name: 'Robert Baratheon',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />

                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '14001',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: true,
                            menu: [],
                            name: 'Robert Baratheon',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                </div>
                <div className='new-card-row'>
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '01040',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: 'The Roseroad',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '01040',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: 'The Roseroad',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '01040',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: 'The Roseroad',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                </div>
                <div className='new-card-row'>
                    <div className='new-left'>
                        <div className='new-plots'>
                            <Card
                                card={ {
                                    attachments: [],
                                    baseStrength: 3,
                                    childCards: [],
                                    code: '01001',
                                    dupes: [],
                                    factionStatus: [],
                                    iconsAdded: [],
                                    iconsRemoved: [],
                                    kneeled: false,
                                    menu: [],
                                    name: 'The Roseroad',
                                    power: 0,
                                    strength: 3,
                                    tokens: {},
                                    type: 'plot'
                                } }
                            />
                            <Card
                                card={ {
                                    attachments: [],
                                    baseStrength: 3,
                                    childCards: [],
                                    code: '01001',
                                    dupes: [],
                                    factionStatus: [],
                                    facedown: true,
                                    iconsAdded: [],
                                    iconsRemoved: [],
                                    kneeled: false,
                                    menu: [],
                                    name: 'The Roseroad',
                                    power: 0,
                                    strength: 3,
                                    tokens: {},
                                    type: 'plot'
                                } }
                            />
                        </div>
                        <Card
                            card={ {
                                attachments: [],
                                baseStrength: 3,
                                childCards: [],
                                code: 'baratheon',
                                dupes: [],
                                factionStatus: [],
                                iconsAdded: [],
                                iconsRemoved: [],
                                kneeled: false,
                                menu: [],
                                name: 'The Roseroad',
                                power: 0,
                                strength: 3,
                                tokens: {},
                                type: 'faction'
                            } }
                        />
                        <Card
                            card={ {
                                attachments: [],
                                baseStrength: 3,
                                childCards: [],
                                code: '14045',
                                dupes: [],
                                factionStatus: [],
                                iconsAdded: [],
                                iconsRemoved: [],
                                kneeled: false,
                                menu: [],
                                name: 'The Roseroad',
                                power: 0,
                                strength: 3,
                                tokens: {},
                                type: 'agenda'
                            } }
                        />
                    </div>
                    <div className='new-middle'>
                        <div className='new-shadows'>
                            <Card
                                card={ {
                                    attachments: [],
                                    baseStrength: 3,
                                    childCards: [],
                                    code: '14045',
                                    dupes: [],
                                    factionStatus: [],
                                    facedown: true,
                                    iconsAdded: [],
                                    iconsRemoved: [],
                                    kneeled: false,
                                    menu: [],
                                    name: 'The Roseroad',
                                    power: 0,
                                    strength: 3,
                                    tokens: {},
                                    type: 'agenda'
                                } }
                                source='shadows'
                            />
                        </div>
                    </div>
                    <div className='new-right'>
                        <Card
                            card={ {
                                attachments: [],
                                baseStrength: 3,
                                childCards: [],
                                code: '14045',
                                dupes: [],
                                factionStatus: [],
                                facedown: true,
                                iconsAdded: [],
                                iconsRemoved: [],
                                kneeled: false,
                                menu: [],
                                name: 'The Roseroad',
                                power: 0,
                                strength: 3,
                                tokens: {},
                                type: 'agenda'
                            } }
                        />
                        <Card
                            card={ {
                                attachments: [],
                                baseStrength: 3,
                                childCards: [],
                                code: '10040',
                                dupes: [],
                                factionStatus: [],
                                facedown: false,
                                iconsAdded: [],
                                iconsRemoved: [],
                                kneeled: false,
                                menu: [],
                                name: 'The Roseroad',
                                power: 0,
                                strength: 3,
                                tokens: {},
                                type: 'agenda'
                            } }
                        />
                        <Card
                            card={ {
                                attachments: [],
                                baseStrength: 3,
                                childCards: [],
                                code: '10040',
                                dupes: [],
                                factionStatus: [],
                                facedown: false,
                                iconsAdded: [],
                                iconsRemoved: [],
                                kneeled: true,
                                menu: [],
                                name: 'The Roseroad',
                                power: 0,
                                strength: 3,
                                tokens: {},
                                type: 'agenda'
                            } }
                        />
                    </div>
                </div>
                <div className='new-hand'>
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '13041',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: '',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '13042',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: '',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '13043',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: '',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                    <Card
                        card={ {
                            attachments: [],
                            baseStrength: 3,
                            childCards: [],
                            code: '13044',
                            dupes: [],
                            factionStatus: [],
                            iconsAdded: [],
                            iconsRemoved: [],
                            kneeled: false,
                            menu: [],
                            name: '',
                            power: 0,
                            strength: 3,
                            tokens: {},
                            type: 'character'
                        } }
                    />
                </div>
            </div>
        );
    }

    render() {
        let thisPlayer = this.props.currentGame.players[this.props.user.username];
        if(!thisPlayer) {
            thisPlayer = Object.values(this.props.currentGame.players)[0];
        }

        if(!thisPlayer) {
            return <div>Waiting for game to have players or close...</div>;
        }

        let otherPlayer = Object.values(this.props.currentGame.players).find(player => {
            return player.name !== thisPlayer.name;
        });

        // Default any missing information
        thisPlayer = this.defaultPlayerInfo(thisPlayer);
        otherPlayer = this.defaultPlayerInfo(otherPlayer);

        let boundActionCreators = bindActionCreators(actions, this.props.dispatch);

        let boardClass = classNames('game-board', {
            'select-cursor': thisPlayer && thisPlayer.selectCard
        });

        return (
            <div className={ boardClass }>
                <div className='main-window'>
                    <div className='game-board-cards'>
                        { this.renderP({ className: 'top' }) }
                        { this.renderP({ className: 'bottom' }) }
                    </div>
                    { this.state.showMessages && (
                        <div className='right-side'>
                            <div className='gamechat'>
                                <GameChat key='gamechat'
                                    messages={ this.props.currentGame.messages }
                                    onCardMouseOut={ this.onMouseOut }
                                    onCardMouseOver={ this.onMouseOver }
                                    onSendChat={ this.sendChatMessage } />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );

        if(!this.props.currentGame || !this.props.cards || !this.props.currentGame.started) {
            return <div>Waiting for server...</div>;
        }

        if(!this.props.user) {
            this.props.navigate('/');
            return <div>You are not logged in, redirecting...</div>;
        }

        return (
            <div className={ boardClass }>
                <GameConfigurationModal
                    id='settings-modal'
                    keywordSettings={ thisPlayer.keywordSettings }
                    onKeywordSettingToggle={ this.onKeywordSettingToggle.bind(this) }
                    onPromptDupesToggle={ this.onPromptDupesToggle.bind(this) }
                    onPromptedActionWindowToggle={ this.onPromptedActionWindowToggle.bind(this) }
                    onTimerSettingToggle={ this.onTimerSettingToggle.bind(this) }
                    promptDupes={ thisPlayer.promptDupes }
                    promptedActionWindows={ thisPlayer.promptedActionWindows }
                    timerSettings={ thisPlayer.timerSettings } />
                <div className='player-stats-row'>
                    <PlayerStats stats={ otherPlayer.stats }
                        user={ otherPlayer.user } firstPlayer={ otherPlayer.firstPlayer } />
                </div>
                <div className='main-window'>
                    { this.renderBoard(thisPlayer, otherPlayer) }
                    <CardZoom imageUrl={ this.props.cardToZoom ? '/img/cards/' + this.props.cardToZoom.code + '.png' : '' }
                        orientation={ this.props.cardToZoom ? this.props.cardToZoom.type === 'plot' ? 'horizontal' : 'vertical' : 'vertical' }
                        show={ !!this.props.cardToZoom } cardName={ this.props.cardToZoom ? this.props.cardToZoom.name : null }
                        card={ this.props.cardToZoom ? this.props.cards[this.props.cardToZoom.code] : null } />
                    { this.state.showMessages && <div className='right-side'>
                        <div className='gamechat'>
                            <GameChat key='gamechat'
                                messages={ this.props.currentGame.messages }
                                onCardMouseOut={ this.onMouseOut }
                                onCardMouseOver={ this.onMouseOver }
                                onSendChat={ this.sendChatMessage } />
                        </div>
                    </div>
                    }
                </div>
                <div className='player-stats-row'>
                    <PlayerStats { ...boundActionCreators } stats={ thisPlayer.stats } showControls={ !this.state.spectating } user={ thisPlayer.user }
                        firstPlayer={ thisPlayer.firstPlayer } onSettingsClick={ this.onSettingsClick } showMessages
                        onMessagesClick={ this.onMessagesClick } numMessages={ this.state.newMessages } />
                </div>
            </div >);
    }
}

GameBoard.displayName = 'GameBoard';
GameBoard.propTypes = {
    cardToZoom: PropTypes.object,
    cards: PropTypes.object,
    clearZoom: PropTypes.func,
    closeGameSocket: PropTypes.func,
    currentGame: PropTypes.object,
    dispatch: PropTypes.func,
    navigate: PropTypes.func,
    packs: PropTypes.array,
    restrictedList: PropTypes.array,
    rookeryDeck: PropTypes.object,
    rookeryPromptId: PropTypes.string,
    sendGameMessage: PropTypes.func,
    setContextMenu: PropTypes.func,
    socket: PropTypes.object,
    stopAbilityTimer: PropTypes.func,
    submitRookeryPrompt: PropTypes.func,
    timerLimit: PropTypes.number,
    timerStartTime: PropTypes.instanceOf(Date),
    user: PropTypes.object,
    zoomCard: PropTypes.func
};

function mapStateToProps(state) {
    return {
        cardToZoom: state.cards.zoomCard,
        cards: state.cards.cards,
        currentGame: state.lobby.currentGame,
        packs: state.cards.packs,
        restrictedList: state.cards.restrictedList,
        rookeryDeck: state.prompt.rookeryDeck,
        rookeryPromptId: state.prompt.rookeryPromptId,
        socket: state.lobby.socket,
        timerLimit: state.prompt.timerLimit,
        timerStartTime: state.prompt.timerStartTime,
        user: state.account.user
    };
}

function mapDispatchToProps(dispatch) {
    let boundActions = bindActionCreators(actions, dispatch);
    boundActions.dispatch = dispatch;

    return boundActions;
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(GameBoard);

