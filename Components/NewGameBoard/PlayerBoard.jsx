import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Card from './Card';
import CardPile from './CardPile';
import DrawDeck from './DrawDeck';
import Droppable from './Droppable';

class PlayerBoard extends React.Component {
    getCardRows() {
        let groupedCards = this.props.cardsInPlay.reduce((group, card) => {
            (group[card.type] = group[card.type] || []).push(card);

            return group;
        }, {});

        let rows = [];
        let locations = groupedCards['location'] || [];
        let characters = groupedCards['character'] || [];
        let other = [];

        for(let key of Object.keys(groupedCards).filter(k => !['location', 'character'].includes(k))) {
            other = other.concat(groupedCards[key]);
        }

        if(this.props.rowDirection === 'reverse') {
            if(other.length > 0) {
                rows.push(other);
            }

            rows.push(locations);
            rows.push(characters);
        } else {
            rows.push(characters);
            rows.push(locations);
            if(other.length > 0) {
                rows.push(other);
            }
        }

        return rows;
    }

    renderRows(rows) {
        return rows.map((row, index) => (
            <div className='card-row' key={ `card-row-${index}` }>
                { this.renderRow(row) }
            </div>
        ));
    }

    renderRow(row) {
        return row.map(card => (
            <Card key={ card.uuid }
                card={ card }
                disableMouseOver={ card.facedown && !card.code }
                onClick={ this.props.onCardClick }
                onMenuItemClick={ this.props.onMenuItemClick }
                onMouseOut={ this.props.onMouseOut }
                onMouseOver={ this.props.onMouseOver }
                size={ this.props.user.settings.cardSize }
                source='play area' />)
        );
    }

    getAgenda() {
        if(!this.props.agenda || this.props.agenda.code === '') {
            let className = classNames('agenda', 'card-pile', 'vertical', 'panel', {
                [this.props.user.settings.cardSize]: this.props.user.settings.cardSize !== 'normal'
            });
            return <div className={ className } />;
        }

        let cards = [];
        let disablePopup = false;
        let title;
        let source = 'agenda';

        // Alliance
        if(this.props.agenda.code === '06018') {
            cards = this.props.bannerCards;
            title = 'Banners';
        } else if(this.props.agenda.code === '09045') {
            cards = this.props.conclavePile;
            source = 'conclave';
            title = 'Conclave';
            disablePopup = !this.props.isMe;
        }

        disablePopup = disablePopup || !cards || cards.length === 0;

        let pileClass = classNames('agenda', `agenda-${this.props.agenda.code}`);

        let pile = (<CardPile className={ pileClass }
            cards={ cards }
            disablePopup={ disablePopup }
            onCardClick={ this.props.onCardClick }
            onDragDrop={ this.props.onDragDrop }
            onMenuItemClick={ this.props.onMenuItemClick }
            onMouseOut={ this.props.onMouseOut }
            onMouseOver={ this.props.onMouseOver }
            popupLocation={ this.props.side }
            source={ source }
            title={ title }
            topCard={ this.props.agenda }
            size={ this.props.cardSize } />);

        if(this.props.agenda.code === '09045') {
            return (
                <Droppable onDragDrop={ this.props.onDragDrop } source='conclave'>
                    { pile }
                </Droppable>
            );
        }

        return pile;
    }

    renderDrawAndDiscard() {
        let cardPileProps = {
            onCardClick: this.props.onCardClick,
            onDragDrop: this.props.onDragDrop,
            onMouseOut: this.props.onMouseOut,
            onMouseOver: this.props.onMouseOver,
            popupLocation: this.props.side,
            size: this.props.cardSize
        };

        let drawDeck = (<DrawDeck
            cardCount={ this.props.numDrawCards }
            cards={ this.props.drawDeck }
            isMe={ this.props.isMe }
            numDrawCards={ this.props.numDrawCards }
            onPopupChange={ this.props.onDrawPopupChange }
            onShuffleClick={ this.props.onShuffleClick }
            showDeck={ this.props.showDeck }
            spectating={ this.props.spectating }
            { ...cardPileProps } />);
        let discardPile = (<CardPile className='discard' title='Discard' source='discard pile' cards={ this.props.discardPile }
            { ...cardPileProps } />);
        let deadPile = (<CardPile className='dead' title='Dead' source='dead pile' cards={ this.props.deadPile }
            orientation='kneeled'
            { ...cardPileProps } />);

        return [
            deadPile,
            drawDeck,
            discardPile
        ];
    }

    render() {
        let rows = this.getCardRows();

        let className = classNames('player-board', {
            'our-side': this.props.rowDirection === 'default'
        });

        return (
            <div className={ className } >
                <div className='faction-and-agenda'>

                </div>
                <div className='draw-and-discard'>
                    <CardPile className='faction' source='faction' cards={ [] } topCard={ this.props.faction }
                        onMouseOver={ this.props.onMouseOver } onMouseOut={ this.props.onMouseOut } disablePopup
                        onCardClick={ this.props.onCardClick }
                        size={ this.props.user.settings.cardSize } />
                    { this.getAgenda() }
                    { this.renderDrawAndDiscard() }
                </div>
                <PlayerHand
                    cards={ this.props.hand }
                    onCardClick={ this.props.onCardClick }
                    onMouseOut={ this.props.onMouseOut }
                    onMouseOver={ this.props.onMouseOver }
                    user={ this.props.user } />
            </div>);
    }
}

function PlayerHand(props) {
    let { cards, onCardClick, onMouseOut, onMouseOver, user } = props;
    return (
        <div className='hand'>
            { cards.map(card => (
                <Card key={ card.uuid }
                    card={ card }
                    onClick={ onCardClick }
                    onMouseOut={ onMouseOut }
                    onMouseOver={ onMouseOver }
                    size={ user.settings.cardSize }
                    source='hand' />)
            ) }
        </div>
    );
}

PlayerBoard.displayName = 'PlayerBoard';
PlayerBoard.propTypes = {
    agenda: PropTypes.object,
    cardsInPlay: PropTypes.array,
    deadPile: PropTypes.array,
    discardPile: PropTypes.array,
    drawDeck: PropTypes.array,
    faction: PropTypes.object,
    hand: PropTypes.array,
    numDrawCards: PropTypes.number,
    onCardClick: PropTypes.func,
    onMenuItemClick: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    rowDirection: PropTypes.oneOf(['default', 'reverse']),
    user: PropTypes.object
};

export default PlayerBoard;
