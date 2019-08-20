import React from 'react';
import PropTypes from 'prop-types';

export default class ReportAbuse extends React.Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleReasonChange = this.handleReasonChange.bind(this);
        this.handleSelectedUserChange = this.handleSelectedUserChange.bind(this);
        this.handleDetailsChange = this.handleDetailsChange.bind(this);

        this.state = {
            selectedUser: '',
            reason: '',
            details: ''
        };
    }

    handleSubmit(event) {
        event.preventDefault();

        this.props.sendGameMessage('reportAbuse', {
            gameId: this.props.gameId,
            selectedUser: this.state.selectedUser,
            reason: this.state.reason,
            details: this.state.details
        });
    }

    handleReasonChange(event) {
        this.setState({ reason: event.target.value });
    }

    handleSelectedUserChange(event) {
        this.setState({ selectedUser: event.target.value });
    }

    handleDetailsChange(event) {
        this.setState({ details: event.target.value });
    }

    render() {
        const {users} = this.props;

        const reasons = [
            'Spam',
            'Harassment',
            'Hate speech',
            'Other'
        ];

        return (
            <form { ...{ onSubmit: this.handleSubmit } }>
                <div className='form-group'>
                    <div className='col-sm-2'>
                        <label htmlFor='report-user'>User:</label>
                    </div>
                    <div className='col-sm-10'>
                        <select id='report-user' className='form-control' onChange={ this.handleSelectedUserChange }>
                            <option />
                            { users.map(user => (<option>{ user }</option>)) }
                        </select>
                    </div>
                </div>
                <div className='form-group'>
                    <div className='col-sm-2'>
                        <label htmlFor='report-reason'>Reason:</label>
                    </div>
                    <div className='col-sm-10'>
                        <select id='report-user' className='form-control' onChange={ this.handleReasonChange }>
                            <option />
                            { reasons.map(reason => (<option>{ reason }</option>)) }
                        </select>
                    </div>
                </div>
                <div className='form-group'>
                    <div className='col-sm-2'>
                        <label htmlFor='report-details'>Details:</label>
                    </div>
                    <div className='col-sm-10'>
                        <textarea { ...{ id: 'report-details', className: 'form-control', onChange: this.handleDetailsChange } } />
                    </div>
                </div>
                <div className='form-group'>
                    <div className='col-sm-offset-2 col-sm-3'>
                        <button type='submit' className='btn btn-primary'>Submit</button>
                    </div>
                </div>
            </form>
        );
    }
}

ReportAbuse.propTypes = {
    gameId: PropTypes.string,
    sendGameMessage: PropTypes.func,
    users: PropTypes.arrayOf(PropTypes.string)
};
