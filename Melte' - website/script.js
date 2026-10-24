
/* =========================================
   MELTE' CHOCOLATE WEBSITE
   PRODUCTS, CART AND CHECKOUT
========================================= */

let products = [
  {
    id: 1,
    name: "Dark Chocolate",
    price: 249,
    quantity: "250g",
    description: "Rich, smooth chocolate for dark chocolate lovers.",
    image: "images/dark.jpg",
    category: "classic"
  },
  {
    id: 2,
    name: "Chocolate Truffles",
    price: 399,
    quantity: "250g",
    description: "Soft, indulgent chocolate truffles.",
    image: "images/truffles.jpg",
    category: "classic"
  },
  {
    id: 3,
    name: "Milk Chocolate",
    price: 199,
    quantity: "250g",
    description: "Creamy milk chocolate that melts in your mouth.",
    image: "images/milk.jpg",
    category: "classic"
  },
  {
    id: 4,
    name: "Hazelnut Chocolate",
    price: 349,
    quantity: "250g",
    description: "Smooth chocolate with delicious hazelnut flavour.",
    image: "images/hazelnut.jpg",
    category: "classic"
  },
  {
    id: 5,
    name: "Peanut Butter Chocolate",
    price: 129,
    quantity: "250g",
    description: "Creamy peanut butter with rich chocolate.",
    image: "images/peanutbutter.jpg",
    category: "classic"
  },
  {
    id: 6,
    name: "Peanut & Dates Chocolate",
    price: 139,
    quantity: "250g",
    description: "Crunchy peanuts, sweet dates and chocolate.",
    image: "images/peanutdates.jpg",
    category: "classic"
  },
  {
    id: 7,
    name: "Coconut Chocolate",
    price: 119,
    quantity: "250g",
    description: "Delicious coconut filling with smooth chocolate.",
    image: "images/coconut.jpg",
    category: "classic"
  },
  {
    id: 8,
    name: "Dry Fruit Chocolate",
    price: 149,
    quantity: "250g",
    description: "Chocolate filled with crunchy nuts and dry fruits.",
    image: "images/dryfruit.jpg",
    category: "classic"
  },
  {
    id: 9,
    name: "Strawberry Chocolate",
    price: 300,
    quantity: "250g",
    description: "Sweet strawberry flavour blended with chocolate.",
    image: "images/strawberry.jpg",
    category: "special"
  },
  {
    id: 10,
    name: "Mango Chocolate",
    price: 350,
    quantity: "250g",
    description: "A fruity mango twist on creamy chocolate.",
    image: "images/mango.jpg",
    category: "special"
  },
  {
    id: 11,
    name: "Lotus Biscoff Chocolate",
    price: 400,
    quantity: "250g",
    description: "Chocolate with delicious Lotus Biscoff flavour.",
    image: "images/biscoff.jpg",
    category: "special"
  },
  {
    id: 12,
    name: "Kunafa Chocolate",
    price: 450,
    quantity: "250g",
    description: "A special chocolate inspired by crunchy kunafa.",
    image: "images/kunafa.jpg",
    category: "special"
  },
  {
    id: 13,
    name: "Chocolate Brownies",
    price: 299,
    quantity: "250g",
    description: "Rich, fudgy chocolate brownies.",
    image: "images/brownies.jpg",
    category: "special"
  },
  {
    id: 14,
    name: "Chocolate Gift Box",
    price: 599,
    quantity: "400g",
    description: "A beautiful assorted chocolate box for gifting.",
    image: "images/giftbox.jpg",
    category: "special"
  }
];

/* =========================================
   CART DATA
========================================= */

let cart = [];

function getProduct(id) {
  return products.find(product => product.id === Number(id));
}

function money(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function getCartTotal() {
  return cart.reduce((total, item) => {
    const product = getProduct(item.id);

    if (!product) {
      return total;
    }

    return total + product.price * item.count;
  }, 0);
}

/* =========================================
   DISPLAY PRODUCTS
========================================= */

function displayProducts() {
  const classicGrid = document.getElementById("classic-products");
  const specialGrid = document.getElementById("special-products");

  if (!classicGrid || !specialGrid) {
    console.error("Product containers not found.");
    return;
  }

  classicGrid.innerHTML = "";
  specialGrid.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";

    image.onerror = () => {
      imageContainer.innerHTML = "";

      const fallback = document.createElement("div");
      fallback.className = "image-fallback";
      fallback.textContent = product.name;

      imageContainer.appendChild(fallback);
    };

    imageContainer.appendChild(image);

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;

    const quantity = document.createElement("p");
    quantity.className = "product-quantity";
    quantity.textContent = "Quantity: " + product.quantity;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = money(product.price);

    const button = document.createElement("button");
    button.className = "btn";
    button.type = "button";
    button.textContent = "Add to Cart";

    button.addEventListener("click", () => {
      addToCart(product.id);
    });

    info.append(
      name,
      description,
      quantity,
      price,
      button
    );

    card.append(imageContainer, info);

    if (product.category === "classic") {
      classicGrid.appendChild(card);
    } else {
      specialGrid.appendChild(card);
    }
  });
}

/* =========================================
   ADD TO CART
========================================= */

function addToCart(id) {
  const product = getProduct(id);

  if (!product) {
    return;
  }

  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.count++;
  } else {
    cart.push({
      id: product.id,
      count: 1
    });
  }

  updateCart();
  openCart();
}

/* =========================================
   CHANGE QUANTITY
========================================= */

function changeQuantity(id, change) {
  const item = cart.find(item => item.id === Number(id));

  if (!item) {
    return;
  }

  item.count += change;

  if (item.count <= 0) {
    cart = cart.filter(item => item.id !== Number(id));
  }

  updateCart();
}

/* =========================================
   REMOVE PRODUCT
========================================= */

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== Number(id));
  updateCart();
}

/* =========================================
   UPDATE SHOPPING CART
========================================= */

function updateCart() {
  const countElement = document.getElementById("cart-count");
  const itemsElement = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");

  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.count,
    0
  );

  if (countElement) {
    countElement.textContent = totalQuantity;
  }

  if (itemsElement) {
    itemsElement.innerHTML = "";

    if (cart.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Your cart is empty. Add some chocolates!";
      itemsElement.appendChild(empty);
    }

    cart.forEach(item => {
      const product = getProduct(item.id);

      if (!product) {
        return;
      }

      const row = document.createElement("div");
      row.className = "cart-item";

      const name = document.createElement("h4");
      name.textContent = product.name;

      const details = document.createElement("p");
      details.textContent =
        `${product.quantity} • ${money(product.price)} each`;

      const subtotal = document.createElement("p");
      subtotal.textContent =
        "Subtotal: " + money(product.price * item.count);

      const controls = document.createElement("div");
      controls.className = "cart-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease quantity");

      minus.addEventListener("click", () => {
        changeQuantity(product.id, -1);
      });

      const quantity = document.createElement("span");
      quantity.textContent = item.count;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase quantity");

      plus.addEventListener("click", () => {
        changeQuantity(product.id, 1);
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-btn";
      remove.textContent = "Remove";

      remove.addEventListener("click", () => {
        removeFromCart(product.id);
      });

      controls.append(
        minus,
        quantity,
        plus,
        remove
      );

      row.append(
        name,
        details,
        subtotal,
        controls
      );

      itemsElement.appendChild(row);
    });
  }

  if (totalElement) {
    totalElement.textContent = getCartTotal().toLocaleString("en-IN");
  }

  updateCheckoutSummary();
}

/* =========================================
   CHECKOUT ORDER SUMMARY
========================================= */

function updateCheckoutSummary() {
  const itemsElement = document.getElementById(
    "checkout-order-items"
  );

  const totalElement = document.getElementById(
    "checkout-order-total"
  );

  if (!itemsElement || !totalElement) {
    return;
  }

  itemsElement.innerHTML = "";

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty.";
    itemsElement.appendChild(empty);
  }

  cart.forEach(item => {
    const product = getProduct(item.id);

    if (!product) {
      return;
    }

    const row = document.createElement("div");
    row.className = "checkout-summary-item";

    // Example: Chocolate Brownies = 1 × ₹299
    const description = document.createElement("span");

    description.textContent =
      `${product.name} = ${item.count} × ${money(product.price)}`;

    row.appendChild(description);
    itemsElement.appendChild(row);
  });

  // money() already includes ₹, so don't add another.
  totalElement.textContent = money(getCartTotal());
}

/* =========================================
   OPEN AND CLOSE CART
========================================= */

function openCart() {
  const panel = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");

  if (panel) {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  if (overlay) {
    overlay.hidden = false;
  }
}

function closeCart() {
  const panel = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");

  if (panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  if (overlay) {
    overlay.hidden = true;
  }
}

/* =========================================
   CHECKOUT POPUP
========================================= */

const checkoutModal = document.getElementById("checkout-modal");
const checkoutForm = document.getElementById("checkout-form");

function openCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  updateCheckoutSummary();

  if (checkoutModal) {
    checkoutModal.hidden = false;
  }

  closeCart();
}

function closeCheckout() {
  if (checkoutModal) {
    checkoutModal.hidden = true;
  }
}

/* =========================================
   STARTUP
========================================= */

/* Products and cart will render after live products load. */

/* =========================================
   CART BUTTON EVENTS
========================================= */

document.getElementById("cart-button")?.addEventListener(
  "click",
  openCart
);

document.getElementById("close-cart")?.addEventListener(
  "click",
  closeCart
);

document.getElementById("cart-overlay")?.addEventListener(
  "click",
  closeCart
);

document.getElementById("checkout-button")?.addEventListener(
  "click",
  openCheckout
);

/* =========================================
   CHECKOUT CLOSE EVENTS
========================================= */

document.getElementById("close-checkout")?.addEventListener(
  "click",
  closeCheckout
);

checkoutModal?.addEventListener("click", event => {
  if (event.target === checkoutModal) {
    closeCheckout();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCheckout();
    closeCart();
  }
});

/* =========================================
   PLACE ORDER USING FLASK
========================================= */

checkoutForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById(
    "customer-name"
  )?.value.trim();

  const phone = document.getElementById(
    "customer-phone"
  )?.value.trim();

  const address = document.getElementById(
    "customer-address"
  )?.value.trim();

  const paymentInput = checkoutForm.querySelector(
    'input[name="payment"]:checked'
  );

  if (!name || !phone || !address) {
    alert("Please fill in all delivery details.");
    return;
  }

  if (!paymentInput) {
    alert("Please select a payment method.");
    return;
  }

  if (paymentInput.value !== "cod") {
    alert(
      "Online payments are coming soon! " +
      "Please select Cash on Delivery."
    );
    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const submitButton = checkoutForm.querySelector(
    'button[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Placing Order...";
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:5001/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          items: cart.map(item => ({
            id: item.id,
            count: item.count
          }))
        })
      }
    );

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Invalid response from server. Check your Flask terminal."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error || "Could not place order."
      );
    }

    
const successModal = document.getElementById(
  "order-success-modal"
);

const successOrderId = document.getElementById(
  "success-order-id"
);

const successOrderTotal = document.getElementById(
  "success-order-total"
);

if (successModal && successOrderId && successOrderTotal) {
  successOrderId.textContent = "#" + result.order_id;
  successOrderTotal.textContent = money(result.total);

  successModal.hidden = false;
}


    cart = [];
    updateCart();

    checkoutForm.reset();
    closeCheckout();
    closeCart();

  } catch (error) {
    console.error("Checkout error:", error);

    alert(
      "Order failed: " + error.message
    );

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Place Order";
    }
  }
});

/* =========================================
   DEMO ENQUIRY FORMS
========================================= */

document.getElementById("custom-form")?.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    alert(
      "This is a demo enquiry form. " +
      "Your request has not been sent yet."
    );
  }
);

document.getElementById("contact-form")?.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    alert(
      "This is a demo contact form. " +
      "Your message has not been sent yet."
    );
  }
);

/* =========================================
   CLOSE THANK YOU POPUP
========================================= */

document.getElementById("success-continue")?.addEventListener(
  "click",
  () => {
    const successModal = document.getElementById(
      "order-success-modal"
    );

    if (successModal) {
      successModal.hidden = true;
    }
  }
);


/* Load live Melte' products from SQLite */
async function refreshMelteProducts() {
  try {
    const response = await fetch(
      "http://127.0.0.1:5001/api/products"
    );
    if (!response.ok) throw new Error("Products unavailable");
    products = await response.json();
    cart = cart.filter(item => getProduct(item.id));
    displayProducts();
    updateCart();
  } catch (error) {
    console.error("Could not load live Melte' products:", error);
    products = [];
    cart = [];
    displayProducts();
    updateCart();
    alert("Products are temporarily unavailable. Please check the connection and try again.");
  }
}
refreshMelteProducts();
