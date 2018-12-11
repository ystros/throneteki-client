import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ThronesIcons } from '../../constants';

class AltCard extends React.Component {

    renderCharacter() {
        let icons = [];

        if(this.props.card.icons) {
            for(let [icon, present] of Object.entries(this.props.card.icons)) {
                if(present) {
                    icons.push(<div className={ `challenge-icon thronesicon thronesicon-${icon} with-background` } />);
                } else {
                    icons.push(<div className='challenge-icon' />);
                }
            }
        }

        let cardText = this.props.card.text.replace(/\n/g, '<br />');
        for(let icon of ThronesIcons) {
            cardText = cardText.replace(new RegExp(`\\[${icon}\\]`, 'g'), `<span class='thronesicon thronesicon-${icon}'></span>`);
        }

        return (
            <div className='card-alt-new'>
                <div className='card-alt-name'>{ this.props.card.unique ? <span className='card-unique' /> : null } { this.props.card.name }</div>
                <div className='card-alt-cost-and-type'>
                    <div className='card-alt-cost'>{ this.props.card.cost }</div>
                    <div className='card-alt-type'>{ this.props.card.type }</div>
                </div>
                <div className={ classNames('card-icons') }>
                    { icons }
                </div>
                {/* <div className='card-strength'>{ this.props.card.strength }</div>
                <div className={ `card-faction thronesicon thronesicon-${this.props.card.faction} with-background` } /> */}
                <div className='card-alt-text-box'>
                    <div className='card-alt-traits'>{ this.props.card.traits.join('. ') }{ this.props.card.traits.length > 0 ? '.' : null }</div>
                    <div className='card-alt-text-body' dangerouslySetInnerHTML={ { __html: cardText } } />
                    { ['attachment'].includes(this.props.card.type) && <div className='card-name'>{ this.props.card.unique ? <span className='card-unique' /> : null } { this.props.card.name }</div> }
                </div>
            </div>
        );
    }

    render() {
        if(this.props.card.type === 'character') {
            return this.renderCharacter();
        }

        let icons = [];

        if(this.props.card.icons) {
            for(let [icon, present] of Object.entries(this.props.card.icons)) {
                if(present) {
                    icons.push(<div className={ `challenge-icon thronesicon thronesicon-${icon} with-background` } />);
                } else {
                    icons.push(<div className='challenge-icon' />);
                }
            }
        }

        let cardText = this.props.card.text.replace(/\n/g, '<br />');
        for(let icon of ThronesIcons) {
            cardText = cardText.replace(new RegExp(`\\[${icon}\\]`, 'g'), `<span class='thronesicon thronesicon-${icon}'></span>`);
        }

        return (
            <div className='card-alt'>
                <div className='card-top-row'>
                    { !['plot', 'agenda'].includes(this.props.card.type) && <div className='card-cost card-icon'>
                        <span className='card-cost-number'>{ this.props.card.cost }</span>
                        <div className='card-type'>{ this.props.card.type }</div>
                    </div>
                    }
                    { ['event', 'agenda'].includes(this.props.card.type) ? <div className='card-name'>{ this.props.card.unique ? <span className='card-unique' /> : null } { this.props.card.name }</div> : <div className='card-name' /> }
                    { ['attachment', 'event'].includes(this.props.card.type) && <div className={ `card-faction attachment thronesicon thronesicon-${this.props.card.faction} with-background` } /> }
                </div>
                <div className={ classNames('card-icons', {
                    'attachment': ['attachment', 'event', 'agenda'].includes(this.props.card.type),
                    'plot': this.props.card.type === 'plot'
                }) }>
                    { icons }
                </div>
                <div className={ classNames('card-name-row', { 'vertical': this.props.card.type === 'location' }) }>
                    { this.props.card.strength && <div className='card-strength'>{ this.props.card.strength }</div> }
                    { this.props.card.type === 'plot' &&
                        <div className='plot-stats'>
                            <div className='plot-income card-icon'>{ this.props.card.plotStats.income }</div>
                            <div className='plot-initiative card-icon'>{ this.props.card.plotStats.initiative }</div>
                            <div className='plot-claim card-icon'>{ this.props.card.plotStats.claim }</div>
                        </div>
                    }
                    { ['character', 'location', 'plot'].includes(this.props.card.type) && <div className='card-name'>{ this.props.card.unique ? <span className='card-unique' /> : null } { this.props.card.name }</div> }
                    { ['character', 'location', 'plot'].includes(this.props.card.type) && <div className={ `card-faction thronesicon thronesicon-${this.props.card.faction} with-background` } /> }
                </div>
                <div className='card-text'>
                    <div className='card-traits'>{ this.props.card.traits.join('. ') }{ this.props.card.traits.length > 0 ? '.' : null }</div>
                    <span className='text-inner' dangerouslySetInnerHTML={ { __html: cardText } } /> { /* eslint-disable-line */ }
                    { ['attachment'].includes(this.props.card.type) && <div className='card-name'>{ this.props.card.unique ? <span className='card-unique' /> : null } { this.props.card.name }</div> }
                </div>
                { this.props.card.type === 'plot' && <div className='plot-reserve'>{ this.props.card.plotStats.reserve }</div> }
            </div>
        );
    }
}

AltCard.displayName = 'AltCard';
AltCard.propTypes = {
    card: PropTypes.object
};

export default AltCard;
