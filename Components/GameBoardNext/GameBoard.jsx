import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import $ from 'jquery';
import { toastr } from 'react-redux-toastr';
import { bindActionCreators } from 'redux';
import classNames from 'classnames';

import Card from '../GameBoard/Card';
import GameChat from '../GameBoard/GameChat';
import * as actions from '../../actions';

import './GameBoard.less';

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

    renderP({ className }) {
        return (
            <div className={ `new-player-board ${className}` }>
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
        // let thisPlayer = this.props.currentGame.players[this.props.user.username];
        // if(!thisPlayer) {
        //     thisPlayer = Object.values(this.props.currentGame.players)[0];
        // }

        // if(!thisPlayer) {
        //     return <div>Waiting for game to have players or close...</div>;
        // }

        // let otherPlayer = Object.values(this.props.currentGame.players).find(player => {
        //     return player.name !== thisPlayer.name;
        // });

        // // Default any missing information
        // thisPlayer = this.defaultPlayerInfo(thisPlayer);
        // otherPlayer = this.defaultPlayerInfo(otherPlayer);

        // let boundActionCreators = bindActionCreators(actions, this.props.dispatch);

        let boardClass = classNames('game-board', {
            // 'select-cursor': thisPlayer && thisPlayer.selectCard
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
                                {/* <GameChat key='gamechat'
                                    messages={ this.props.currentGame.messages }
                                    onCardMouseOut={ this.onMouseOut }
                                    onCardMouseOver={ this.onMouseOver }
                                    onSendChat={ this.sendChatMessage } /> */}
                            </div>
                        </div>
                    ) }
                </div>
            </div>
        );
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

