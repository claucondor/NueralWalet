import React from 'react';
import styled from 'styled-components';

const ButtonStyled = () => {
  return (
    <StyledWrapper>
      <button>Click me</button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    color: #ffffff;
    padding: 0.7em 1.7em;
    font-size: 18px;
    border-radius: 1rem;
    background-image: linear-gradient(to right, #464646, #000000);

    cursor: pointer;
    border: 1px solid #dadada;
    transition: all 0.7s;
    box-shadow:
      6px 6px 12px #c5c5c5,
      -6px -6px 12px #ffffff;
  }

  button:active {
    color: #000000;
    box-shadow:
      inset 21px 21px 21px #c5c5c5,
      inset -21px -21px 21px #ffffff;
  }`;

export default ButtonStyled;
