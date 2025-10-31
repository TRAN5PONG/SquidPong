// src/lib/Zeroact/index.ts
import { createElement } from './core/createElement';
import { render } from './core/render';
import { useState } from './hooks/useState';
import { useRef } from './hooks/useRef';
import { useEffect } from './hooks/useEffect';
import { useCallback } from './hooks/useCallback';
import { createContext, useContext } from './hooks/useContext';

export { createElement, render, useState, useRef, useEffect, useCallback, createContext, useContext };
export * from './types';

const Fragment = (props: { children: any }) => props.children;

const Zeroact = {
  createElement,
  render,
  useState,
  useEffect,
  useRef,
  Fragment,
  useCallback,
  createContext,
  useContext,
};

export default Zeroact;