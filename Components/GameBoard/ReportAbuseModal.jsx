import React from 'react';
import PropTypes from 'prop-types';

import ReportAbuse from './ReportAbuse';
import Modal from '../Site/Modal';

const ReportAbuseModal = (props) => {
    const {id, gameId, sendGameMessage, users} = props;
    return (
        <Modal { ...{id, title: 'Report Abuse', className: 'settings-popup row', bodyClassName: 'col-xs-12'} }>
            <ReportAbuse { ...{users, sendGameMessage, gameId} } />
        </Modal>
    );
};

ReportAbuseModal.propTypes = {
    gameId: PropTypes.string,
    id: PropTypes.string,
    sendGameMessage: PropTypes.func,
    users: PropTypes.arrayOf(PropTypes.string)
};

export default ReportAbuseModal;
