import React from 'react';
import styled from 'styled-components';

interface ButtonIconProps {
    onClick?: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
}

const ButtonIcon: React.FC<ButtonIconProps> = ({ onClick, disabled, icon }) => {
    return (
        <StyledWrapper>
            <button className="btn" onClick={onClick} disabled={disabled}>
                {icon || (
                    <>
                        <svg className="svg" xmlns="http://www.w3.org/2000/svg" version="1.0" width="256.000000pt" height="256.000000pt" viewBox="0 0 256.000000 256.000000" preserveAspectRatio="xMidYMid meet">
                            <g transform="translate(0.000000,256.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                                <path d="M200 2525 c-60 -19 -123 -74 -152 -133 -22 -44 -23 -60 -26 -269 -4 -213 -3 -222 17 -242 l21 -21 1180 0 1180 0 -2 -820 -3 -820 -38 -37 -37 -38 -1058 0 c-1041 0 -1057 0 -1084 20 -60 44 -58 23 -58 729 0 633 0 646 -20 666 -11 11 -29 20 -40 20 -11 0 -29 -9 -40 -20 -20 -20 -20 -33 -20 -663 0 -738 -2 -716 80 -797 84 -85 13 -80 1180 -80 1167 0 1096 -5 1180 80 85 84 80 13 80 1180 0 1167 5 1096 -80 1180 -84 85 -12 80 -1184 79 -853 0 -1039 -3 -1076 -14z m231 -254 c64 -65 20 -171 -71 -171 -33 0 -48 6 -71 29 -64 65 -20 171 71 171 33 0 48 -6 71 -29z m400 0 c64 -65 20 -171 -71 -171 -33 0 -48 6 -71 29 -64 65 -20 171 71 171 33 0 48 -6 71 -29z m1427 -27 c30 -20 30 -68 0 -88 -20 -14 -82 -16 -482 -16 -413 0 -461 2 -478 17 -22 20 -23 61 -1 85 15 17 43 18 477 18 402 0 464 -2 484 -16z" />
                            </g>
                        </svg>
                        <i className="fas fa-fingerprint" />
                    </>
                )}
            </button>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  button {
    width: 45px; /* Reduced from 60px */
    height: 45px; /* Reduced from 60px */
    transform: scale(1);
    border-style: none;
    outline: none;
    cursor: pointer;
    border-radius: 50%;
    background: rgb(228, 232, 236);
    background: linear-gradient(45deg, rgb(228, 232, 236) 0%, rgb(234 234 234) 100%);
    box-shadow: -2px -5px 8px #f1f1f1, 3px 4px 8px #d4d7da; /* Smaller shadow */
    transition: all .3s;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button svg {
    width: 20px; /* Reduced from 25px */
    height: 20px; /* Reduced from 25px */
  }

  button:active {
    background: rgb(218, 221, 224);
    background: linear-gradient(45deg, rgb(218, 221, 224) 0%, rgb(241, 241, 241) 100%);
    box-shadow: -2px -7px 10px #d4d7da, 
      4px 6px 10px #f1f1f1,
      inset -2px -7px 10px #f1f1f1, 
      inset 4px 6px 10px #d4d7da;
    transition: all .3s;
    transform: scale(.95);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button i {
    font-size: 20px;
    background: linear-gradient(-45deg, gray 0%, lightgray 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: all .3s;
  }

  button:active i {
    transform: scale(.9);
    transition: all .3s;
  }

  .svg {
    width: 25px;
    height: 25px;
    border-style: none;
    display: block;
    margin: 0 auto;
  }`;

export default ButtonIcon;
