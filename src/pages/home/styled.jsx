import styled from 'styled-components';

const HomeStyled = styled.div`
  padding: 20px;
  .wrap {
    display: flex;
    .card {
      width: 200px;
      margin-left: 10px;
      &:first-child {
        margin-left: 0;
      }
      &.active {
        background-color: #80dcf8;
      }
    }
  }
  .content {
    max-width: 80%;
    padding-top: 10px;
    .status {
      color: #1fce76;
      font-weight: 600;
    }
    .ant-list-item-meta-description {
      max-height: 200px;
      overflow: auto;
    }
  }
  
`
export default HomeStyled;
